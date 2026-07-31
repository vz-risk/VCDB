#!/usr/bin/env python3
"""Validate a VCDB submitted incident: semantic lint + JSON-schema validation.

Usage:
    python3 validate.py <path-to-incident.json> [--schema <path-to-vcdb-merged.json>]

Runs the semantic lint FIRST (cross-field coding-correctness checks the JSON
schema cannot express), then validates against vcdb-merged.json. Prints
"LINT OK" and "VALID" on success. Exits non-zero on the first stage that fails.

The lint checks are intentionally byte-faithful to the rules in SKILL.md Step 5.
The lint does NOT and CANNOT detect speculation — only the analyst can ensure
every non-Unknown value is source-backed and recorded in plus.analyst_notes.
This script is deliberately version-agnostic (it checks only that the
"Encoded by AI" attribution line is present, not the exact skill version) so it
never needs bumping when the skill version changes.
"""
import argparse
import json
import os
import sys


def lint(inst):
    """Return (errors, warnings) lists for the instance dict."""
    errs = []
    action = inst.get('action', {})
    attr = inst.get('attribute', {})
    asset_varieties = [a.get('variety', '') for a in inst.get('asset', {}).get('assets', [])]

    # (1)+(2) Any action.social block => integrity "Alter behavior" + a People ("P - ") asset
    if 'social' in action:
        integ = attr.get('integrity', {}).get('variety', [])
        if 'Alter behavior' not in integ:
            errs.append("action.social present but attribute.integrity.variety lacks 'Alter behavior'")
        if not any(v.startswith('P - ') for v in asset_varieties):
            errs.append("action.social present but no 'P - ' (People) asset in asset.assets")
        soc = action['social']
        if not soc.get('target'):
            errs.append("action.social.target is empty")
        if not soc.get('vector'):
            errs.append("action.social.vector is empty")

    # (3) data_disclosure == "Yes" => confidentiality.data must be non-empty
    conf = attr.get('confidentiality', {})
    if conf.get('data_disclosure') == 'Yes' and not conf.get('data'):
        errs.append("confidentiality.data_disclosure == 'Yes' but confidentiality.data is empty")
    # (3b) confidentiality.data set => confidentiality.state must be set too
    if conf.get('data') and not conf.get('state'):
        errs.append("confidentiality.data is set but confidentiality.state is missing")

    # (4) event_chain consistency (only checked when event_chain is present)
    ec = inst.get('plus', {}).get('event_chain', [])
    if ec:
        A = {'hacking': 'hak', 'malware': 'mal', 'social': 'soc', 'misuse': 'mis',
             'error': 'err', 'physical': 'phy', 'environmental': 'env'}
        main_actions = {A[k] for k in action if k in A}
        chain_actions = {e.get('action') for e in ec} - {'unk', None}
        extra = chain_actions - main_actions
        if extra:
            errs.append(f"event_chain uses action(s) {sorted(extra)} not present in top-level action.*")
        if 'social' in action and not any(e.get('asset') == 'ppl' for e in ec):
            errs.append("action.social present but no event_chain step targets a person (asset 'ppl')")

    # (5) value_chain is deprecated — it must not be present
    if 'value_chain' in inst:
        errs.append("top-level 'value_chain' present — deprecated, remove it (we no longer encode value_chain)")

    plus = inst.get('plus', {})

    # (6) metadata fields this skill always sets to a fixed value
    if inst.get('schema_name') != 'vcdb':
        errs.append(f"top-level schema_name must be 'vcdb' (got {inst.get('schema_name')!r})")
    if inst.get('source_id') != 'vcdb':
        errs.append(f"top-level source_id must be 'vcdb' (got {inst.get('source_id')!r})")
    if plus.get('analysis_status') != 'First pass':
        errs.append(f"plus.analysis_status must be 'First pass' for a submitted record (got {plus.get('analysis_status')!r})")
    notes = str(plus.get('analyst_notes', ''))
    if not notes.lstrip().startswith('Closes http'):
        errs.append("plus.analyst_notes must begin with 'Closes <issue URL>'")
    if 'Encoded by AI' not in notes:
        errs.append("plus.analyst_notes must include the 'Encoded by AI — ... skill version <YYYYMMDDThhmmssZ>' attribution line")

    # (7) confidence present and valid
    conf_level = inst.get('confidence')
    if conf_level not in ('High', 'Medium', 'Low', 'None'):
        errs.append(f"top-level confidence missing or invalid: {conf_level!r}")

    # (8) data_abuse is OPTIONAL. It is a sub-field of the confidentiality
    #     attribute describing downstream misuse/abuse of disclosed data, and the
    #     corpus sets it on only ~1/3 of confidentiality breaches — do NOT require
    #     it on every record. If present, it must be a valid enum value.
    ABUSE_YES = {'Yes', 'Yes - Data ransomed', 'Yes - Identity theft',
                 'Yes - Financial fraud', 'Yes - Posted on personal forum'}
    ABUSE_OK = ABUSE_YES | {'No', 'Other', 'Unknown'}
    abuse = plus.get('attribute', {}).get('confidentiality', {}).get('data_abuse')
    if abuse is not None and abuse not in ABUSE_OK:
        errs.append(f"plus.attribute.confidentiality.data_abuse invalid value: {abuse!r} (allowed: {sorted(ABUSE_OK)})")

    # (8b) port of checkValidity.checkPlusAttributeConsistency: anything coded
    #      under plus.attribute.confidentiality (e.g. data_abuse) implies
    #      confidentiality was an affected attribute. data_abuse must never be set
    #      on an availability-only / no-confidentiality incident.
    if plus.get('attribute', {}).get('confidentiality') and 'confidentiality' not in attr:
        errs.append("plus.attribute.confidentiality is set but attribute.confidentiality is not an affected "
                    "attribute (data_abuse only applies when confidentiality was impacted) — "
                    "remove it, or add the confidentiality attribute if the breach did affect confidentiality")

    # (9) consistency: confirmed data abuse requires the data to have been disclosed
    if abuse in ABUSE_YES and conf.get('data_disclosure') != 'Yes':
        errs.append(f"data_abuse '{abuse}' implies disclosure, but confidentiality.data_disclosure != 'Yes'")

    # (10) consistency: an 'Exfiltrate' action result implies data disclosure
    results = set()
    for cat in ('hacking', 'malware', 'social', 'misuse', 'error', 'physical', 'environmental'):
        results |= set(action.get(cat, {}).get('result', []) or [])
    if 'Exfiltrate' in results and conf.get('data_disclosure') not in ('Yes', 'Potentially'):
        errs.append("an action.result of 'Exfiltrate' implies confidentiality.data_disclosure 'Yes'/'Potentially'")

    # (11) dbir_year sanity. The VCDB "DBIR year" N covers the window
    #      Nov 1 (N-2) .. Oct 31 (N-1); the boundary flips on Nov 1. So the
    #      EARLIEST DBIR year an incident can belong to is incident_year+1 for a
    #      Jan-Oct begin date (or a year-only date, treated as Jan 1) and
    #      incident_year+2 for a Nov/Dec begin date. A *later* dbir_year is
    #      legitimate when the incident was only discovered/disclosed later (the
    #      analyst derives it from that date), so we only flag values that are too
    #      EARLY to be possible -- never later ones.
    inc = inst.get('timeline', {}).get('incident', {})
    iy = inc.get('year')
    im = inc.get('month')
    dy = plus.get('dbir_year')
    if isinstance(iy, int) and isinstance(dy, int):
        min_dbir = iy + 2 if (isinstance(im, int) and im >= 11) else iy + 1
        if dy < min_dbir:
            mon = ('-%02d' % im) if isinstance(im, int) else ''
            errs.append(
                f"plus.dbir_year {dy} is too early for an incident beginning {iy}{mon}: the "
                f"DBIR-year window flips on Nov 1, so the earliest valid dbir_year is {min_dbir} "
                f"(incident_year+{min_dbir - iy}). A later dbir_year is fine if the incident was "
                f"discovered/disclosed later (derive it from that date); an earlier one is impossible.")

    # (12)-(21) cross-field consequences ported from upstream VERIS rules.py
    # (adapted to this repo's current vcdb-merged.json field names — see
    # SKILL.md "Cross-field consequences" for the two known field-name drifts).
    mal = action.get('malware', {})
    mal_variety = mal.get('variety', [])
    mal_vector = mal.get('vector', [])
    integ = attr.get('integrity', {}).get('variety', [])
    avail = attr.get('availability', {}).get('variety', [])

    # (12) malware => integrity "Software installation"
    if 'malware' in action and 'Software installation' not in integ:
        errs.append("action.malware present but attribute.integrity.variety lacks 'Software installation'")

    # (13) ransomware => integrity "Interruption" AND availability "Obscuration"
    if 'Ransomware' in mal_variety:
        if 'Interruption' not in integ:
            errs.append("action.malware.variety includes 'Ransomware' but attribute.integrity.variety lacks 'Interruption'")
        if 'Obscuration' not in avail:
            errs.append("action.malware.variety includes 'Ransomware' but attribute.availability.variety lacks 'Obscuration'")

    # (14) SQLi => integrity "Repurpose"
    if 'SQLi' in action.get('hacking', {}).get('variety', []) and 'Repurpose' not in integ:
        errs.append("action.hacking.variety includes 'SQLi' but attribute.integrity.variety lacks 'Repurpose'")

    # (15) physical Theft / error Loss => availability "Loss"
    if 'Theft' in action.get('physical', {}).get('variety', []) and 'Loss' not in avail:
        errs.append("action.physical.variety includes 'Theft' but attribute.availability.variety lacks 'Loss'")
    if 'Loss' in action.get('error', {}).get('variety', []) and 'Loss' not in avail:
        errs.append("action.error.variety includes 'Loss' but attribute.availability.variety lacks 'Loss'")

    # (16) hacking vector Web application => an asset for it
    if 'Web application' in action.get('hacking', {}).get('vector', []) and 'S - Web application' not in asset_varieties:
        errs.append("action.hacking.vector includes 'Web application' but asset.assets lacks a 'S - Web application' entry")

    # (17) DoS malware => Secondary motive on whichever actor orientation is populated
    if 'DoS' in mal_variety:
        for orient in ('external', 'internal', 'partner'):
            if orient in inst.get('actor', {}):
                motive = inst['actor'][orient].get('motive', [])
                if 'Secondary' not in motive:
                    errs.append(f"action.malware.variety includes 'DoS' but actor.{orient}.motive lacks 'Secondary'")
                break

    # (18) sum/max consistency
    loss_amounts = [l.get('amount', 0) for l in inst.get('impact', {}).get('loss', []) if isinstance(l, dict)]
    if loss_amounts:
        overall = inst.get('impact', {}).get('overall_amount')
        if overall is not None and overall < sum(loss_amounts):
            errs.append(f"impact.overall_amount ({overall}) is less than the sum of impact.loss[].amount ({sum(loss_amounts)})")
    data_amounts = [d.get('amount', 0) for d in conf.get('data', []) if isinstance(d, dict)]
    if data_amounts:
        data_total = conf.get('data_total')
        if data_total is not None and data_total < max(data_amounts):
            errs.append(f"attribute.confidentiality.data_total ({data_total}) is less than the max of attribute.confidentiality.data[].amount ({max(data_amounts)})")
    secondary = inst.get('victim', {}).get('secondary', {})
    sec_ids = secondary.get('victim_id', [])
    sec_amount = secondary.get('amount')
    if sec_ids and sec_amount is not None and sec_amount < len(sec_ids):
        errs.append(f"victim.secondary.amount ({sec_amount}) is less than the number of victim.secondary.victim_id entries ({len(sec_ids)})")

    # (19) enumeration hierarchies: child value requires its parent value too
    conf_state = conf.get('state', [])
    if any(v in conf_state for v in ('Stored encrypted', 'Stored unencrypted')) and 'Stored' not in conf_state:
        errs.append("attribute.confidentiality.state has 'Stored encrypted'/'Stored unencrypted' but lacks the parent 'Stored'")
    if any(v in conf_state for v in ('Transmitted encrypted', 'Transmitted unencrypted')) and 'Transmitted' not in conf_state:
        errs.append("attribute.confidentiality.state has 'Transmitted encrypted'/'Transmitted unencrypted' but lacks the parent 'Transmitted'")

    if any(v in mal_variety for v in ('Click fraud', 'Cryptocurrency mining')) and 'Click fraud and cryptocurrency mining' not in mal_variety:
        errs.append("action.malware.variety has 'Click fraud'/'Cryptocurrency mining' but lacks the parent 'Click fraud and cryptocurrency mining'")
    if any(v in mal_variety for v in ('Backdoor', 'C2')) and 'Backdoor or C2' not in mal_variety:
        errs.append("action.malware.variety has 'Backdoor'/'C2' but lacks the parent 'Backdoor or C2'")
    if 'Backdoor' in mal_variety and 'Trojan' in mal_variety and 'RAT' not in mal_variety:
        errs.append("action.malware.variety has both 'Backdoor' and 'Trojan' but lacks the parent 'RAT'")
    if 'RAT' in mal_variety:
        if 'Backdoor' not in mal_variety:
            errs.append("action.malware.variety has 'RAT' but lacks 'Backdoor'")
        if 'Trojan' not in mal_variety:
            errs.append("action.malware.variety has 'RAT' but lacks 'Trojan'")

    if any(v in mal_vector for v in ('Web application - download', 'Web application - drive-by')) and 'Web application' not in mal_vector:
        errs.append("action.malware.vector has 'Web application - download'/'Web application - drive-by' but lacks the parent 'Web application'")
    email_children = ('Email attachment', 'Email autoexecute', 'Email link', 'Email other', 'Email unknown')
    if any(v in mal_vector for v in email_children) and 'Email' not in mal_vector:
        errs.append("action.malware.vector has an Email sub-variety but lacks the parent 'Email'")

    hak_exploit_varieties = {
        'Abuse of functionality', 'Buffer overflow', 'Cache poisoning', 'Cryptanalysis', 'CSRF',
        'Forced browsing', 'Format string attack', 'Fuzz testing', 'HTTP request smuggling',
        'HTTP request splitting', 'HTTP response smuggling', 'HTTP response splitting',
        'Insecure deserialization', 'Integer overflows', 'LDAP injection', 'Mail command injection',
        'AitM', 'Null byte injection', 'OS commanding', 'Path traversal', 'Reverse engineering', 'RFI',
        'Routing detour', 'Session fixation', 'Session prediction', 'Session replay', 'Soap array abuse',
        'Special element injection', 'SQLi', 'SSI injection', 'URL redirector abuse', 'User breakout',
        'Virtual machine escape', 'XML attribute blowup', 'XML entity expansion', 'XML external entities',
        'XML injection', 'XPath injection', 'XQuery injection', 'XSS',
    }
    hak_variety = action.get('hacking', {}).get('variety', [])
    if hak_exploit_varieties.intersection(hak_variety) and 'Exploit vuln' not in hak_variety:
        errs.append("action.hacking.variety has an exploit-style variety but lacks the parent 'Exploit vuln'")

    if any(v in ('U - Desktop', 'U - Laptop') for v in asset_varieties) and 'U - Desktop or laptop' not in asset_varieties:
        errs.append("asset.assets has 'U - Desktop'/'U - Laptop' but lacks the parent 'U - Desktop or laptop'")

    soc_target = action.get('social', {}).get('target', [])
    if any(v in soc_target for v in ('End-user', 'Other employee')) and 'End-user or employee' not in soc_target:
        errs.append("action.social.target has 'End-user'/'Other employee' but lacks the parent 'End-user or employee'")

    conf_data_varieties = [d.get('variety') for d in conf.get('data', []) if isinstance(d, dict)]
    if any(v in conf_data_varieties for v in ('Medical', 'Sensitive Personal', 'Bank', 'Payment')) and 'Personal' not in conf_data_varieties:
        errs.append("attribute.confidentiality.data has a Personal sub-variety but lacks the parent 'Personal'")
    if any(v in conf_data_varieties for v in ('API key', 'Digital certificate', 'Multi-factor credential', 'Session key')) and 'Credentials' not in conf_data_varieties:
        errs.append("attribute.confidentiality.data has a Credentials sub-variety but lacks the parent 'Credentials'")

    if any(v in integ for v in ('Register MFA device', 'Created account')) and 'Modify authentication' not in integ:
        errs.append("attribute.integrity.variety has 'Register MFA device'/'Created account' but lacks the parent 'Modify authentication'")

    # ---- soft consistency WARNINGS: reconsider, or justify in analyst_notes (non-fatal) ----
    warns = []

    def _all_unknown(vals):
        vals = [v for v in vals if v]
        return bool(vals) and all(str(v).endswith('Unknown') for v in vals)

    actor_vars = [v for blk in inst.get('actor', {}).values()
                  if isinstance(blk, dict) for v in blk.get('variety', [])]
    action_vars = [v for cat in action.values()
                   if isinstance(cat, dict) for v in cat.get('variety', [])]
    unknown_As = sum([_all_unknown(actor_vars), _all_unknown(action_vars), _all_unknown(asset_varieties)])
    # (W1) High confidence requires the 4 A's to be established (colleague's rule)
    if conf_level == 'High' and unknown_As >= 2:
        warns.append("confidence 'High' but 2+ of the 4 A's are entirely Unknown — confirm 'High' is justified or downgrade to 'Medium'")

    return errs, warns


def find_schema(explicit):
    """Locate vcdb-merged.json: explicit arg, then repo root (4 levels up from
    this script: scripts/ -> skill/ -> skills/ -> .claude/ -> repo root), then CWD."""
    if explicit:
        return explicit
    here = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(here, '..', '..', '..', '..'))
    candidates = [
        os.path.join(repo_root, 'vcdb-merged.json'),
        os.path.join(os.getcwd(), 'vcdb-merged.json'),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return candidates[0]  # report the most likely path in the error


def main():
    ap = argparse.ArgumentParser(description="Lint + schema-validate a VCDB incident JSON.")
    ap.add_argument('instance', help='path to the incident JSON file')
    ap.add_argument('--schema', help='path to vcdb-merged.json (auto-located if omitted)')
    args = ap.parse_args()

    with open(args.instance) as f:
        inst = json.load(f)

    # --- Stage 1: semantic lint (run FIRST) ---
    errs, warns = lint(inst)
    if errs:
        print("LINT FAIL:")
        for e in errs:
            print("  -", e)
        sys.exit(1)
    if warns:
        print("LINT WARN (reconsider, or record the rationale in plus.analyst_notes):")
        for w in warns:
            print("  -", w)
    print("LINT OK")

    # --- Stage 2: JSON-schema validation ---
    try:
        import jsonschema
    except ImportError:
        print("ERROR: jsonschema not installed. Run: python3 -m pip install --quiet jsonschema",
              file=sys.stderr)
        sys.exit(2)

    schema_path = find_schema(args.schema)
    if not os.path.isfile(schema_path):
        print(f"ERROR: schema not found at {schema_path} (pass --schema <path>)", file=sys.stderr)
        sys.exit(2)
    with open(schema_path) as f:
        schema = json.load(f)
    jsonschema.validate(inst, schema)
    print("VALID")


if __name__ == '__main__':
    main()
