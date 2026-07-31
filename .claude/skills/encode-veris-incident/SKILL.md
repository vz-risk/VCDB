---
name: encode-veris-incident
version: "20260731T234508Z"
description: Encode a GitHub issue describing a data breach into a VERIS-schema JSON incident for VCDB. Invoke with a vz-risk/VCDB issue URL (e.g. https://github.com/vz-risk/VCDB/issues/23372) and an optional analyst GitHub handle. Reads the issue and its linked sources, finds an additional independent source via web search, maps everything to the VERIS schema (vcdb-merged.json), and writes a validated JSON file to data/json/submitted/.
---

# Encode a GitHub issue into a VERIS / VCDB incident

You turn a GitHub issue that describes a data breach into one VERIS-schema JSON
object and write it to `data/json/submitted/<UUID>.json`.

**Skill version: `20260731T234508Z`.** This is the skill's revision timestamp
(UTC date + Zulu time, `YYYYMMDDThhmmssZ`). Claude skills have no automatic
version number, so this string is the version of record. Bump it whenever you
edit this skill to the current UTC date+time —
`python3 -c "import datetime; print(datetime.datetime.now(datetime.UTC).strftime('%Y%m%dT%H%M%SZ'))"`
— and embed it verbatim in `plus.analyst_notes` (see Step 4) so reviewers know
which skill version — and that AI — produced each record.

## Inputs

- **Required:** a GitHub issue URL, e.g. `https://github.com/vz-risk/VCDB/issues/23372`.
- **Optional:** the analyst's GitHub handle for `plus.analyst`. If it was not
  provided when the skill was invoked, ask the user for it once before writing
  the file (do not guess it).

## Reference material — read these first

- Local schema: `vcdb-merged.json` (repo root). This is the **authoritative
  schema and enumeration list** the output is validated against. Read it to
  learn the exact allowed enum values for every field before assigning any.
- Local labels/enum helpers if useful: `vcdb-enum.json`, `vcdb-labels.json`,
  `vcdb-keynames.txt`.
- Online docs: https://verisframework.org/schema-docs.html for the meaning of
  fields and the 4 A's (Actor, Action, Asset, Attribute).
- A real example incident: any file under `data/json/validated/` shows the
  expected shape (e.g. `incident_id`, `action`, `actor`, `asset`, `attribute`,
  `discovery_method`, `timeline`, `victim`, `reference`, `summary`, `plus`).
- **Fallback reference (use only when needed):** the full VERIS Coding Style
  Guide v3.0 is bundled (git-ignored) at
  `references/coding-style-guide-v3.0.txt` (and `.pdf`) relative to this skill.
  The common coding rules are already distilled inline below, so do **not** read
  the whole guide on every run. Consult it only for a case type the inline rules
  don't cover (rare action varieties, unusual multi-actor or supply-chain
  situations) — `grep` the `.txt` for the action/topic rather than reading it
  end to end.
- **Templates are NOT in the guide PDF.** The starter template JSON files live in
  the `vz-risk/veris` GitHub repo (https://github.com/vz-risk/veris). When a
  template-name tag is present, fetch the matching template from there, not from
  the bundled guide (which only describes templates in prose/diagrams).

## Procedure

### 1. Gather the breach facts (be thorough — use multiple sources)

1. **Read the GitHub issue.** `gh` is not installed, so fetch the issue with
   WebFetch (the vz-risk/VCDB repo is public). Extract:
   - The title and full description of the breach.
   - **Labels / tags** on the issue — these are strong signals. In particular a
     **NAICS code** label maps directly to `victim.industry`; action-category
     labels (Hacking, Malware, Misuse, Error, Physical, Social, Environmental)
     map to the corresponding `action.*` block; `Breach` vs `Incident` informs
     `attribute.confidentiality.data_disclosure`.
   - **Template-name labels are the strongest signal of all.** Many VCDB issue
     tags are *coding template names*, formatted `Action-actor-variety[-differentiator]`
     (e.g. `Hacking-ext-unknown`, `Hacking-ext-stolencreds`, `Social-ext-Extortion`,
     `Social-ext-Phish`, `Malware-ext-Ransomware-databreach`,
     `Malware-ext-Ransomware-nobreach`, `Error-int-misconfig-srv`,
     `Misuse-int-privabuse`, `Physical-ext-theft-userdev`, `Social-Hacking-ext`).
     Decode the tag directly: `Hacking-ext-unknown` → external actor, `action.hacking`
     with `variety: ["Unknown"]`; `Malware-ext-Ransomware-databreach` → external
     actor, ransomware malware + confirmed confidentiality breach; etc. Starter
     template JSON files live in the `vz-risk/veris` repo
     (https://github.com/vz-risk/veris) — you may fetch the matching template as a
     scaffold and then fill in case specifics. The template gives you Action +
     Actor + key varieties for free; you still supply victim demographics, assets,
     discovery method, attributes, and references.
   - **IGNORE `PHIDBR####` labels entirely.** They are an artifact/noise tag the
     team applies to mark incidents that *would* go into a (largely dormant)
     medical-breach report. They are NOT a data signal: do not let them affect
     `plus.sub_source`, dates, `plus.dbir_year`, or any other field. In
     particular the embedded year (e.g. the `2019` in `PHIDBR2019`) is NOT the
     incident year.
   - Every **URL / reference** mentioned in the issue body and comments.
2. **Visit the linked URLs** with WebFetch and read them for incident detail
   (who, what, how, what data, how many records, when, victim org & size).
3. **Find an additional independent source — but only when the issue needs it.**
   If the issue body/comments already contain multiple corroborating source
   URLs, that's sufficient sourcing; searching for one more is optional (still
   worth doing for a very recent development, but not required). If the issue
   has one or zero sources, run a WebSearch for the victim organization +
   "data breach" (plus year/specifics) and fetch at least one credible source
   not already linked in the issue, to corroborate or fill gaps.
   **Always include every issue-linked URL in `reference`, in addition to any
   new source(s) you find** — do not let "go find a newer source" cause you to
   drop the URLs that were already in the issue body or comments. They go in
   the top-level `reference` field as a single string with URLs separated by
   **semicolons** (`; `), which is the VCDB/WebApp convention.
   - **Social media is NOT a source.** Reddit, X/Twitter, Facebook, and LinkedIn
     posts may *point* you to a real article, but never cite the social-media
     post itself in `reference` — follow it to the underlying article and cite
     that. Prefer established security press, vendor/IR advisories, official
     victim notices, and mainstream news; weight `confidence` accordingly.
4. **Establish the real incident date from the sources BEFORE trusting any year
   in a label or tag.** A recent article can describe an old breach and vice
   versa. Never flag a "conflict" between a label year and the breach until you
   have read the sources and know the actual date. `timeline.incident` is the
   date the incident **began** — the earliest known compromise / initial-access
   date — **not** the disclosure or report date. When both are known and differ
   (e.g. access in March, disclosed in June), use the **begin** date for
   `timeline.incident` and capture the gap as a duration in `timeline.compromise`.
   `timeline.incident.year` follows this begin date. `plus.dbir_year` is **derived
   from** it but is **not** the same number — see the DBIR-year rule in Step 4.
5. **Look up the victim's employee count — do not leave it `Unknown` by default.**
   Run a WebSearch for the victim org (e.g. `"<org name> employees"`, LinkedIn,
   or a company-profile/Google Business result) and map the result to the
   nearest `victim.employee_count` enum bucket in `vcdb-merged.json`. Only fall
   back to `"Unknown"` when no source or lookup yields even an approximate
   headcount.
6. **Attribution: a documented named actor stands unless a source contradicts
   it.** If one source names a group and only an *earlier* source says "no one
   has claimed," treat the named attribution as current (note the discrepancy in
   `plus.analyst_notes`). When an actor is named, **research that actor** (a
   quick WebSearch) to set `actor.external.variety` and `motive` correctly —
   e.g. a cyber-extortion / ransomware crew is typically `variety: ["Organized
   crime"]`, `motive: ["Financial"]` — and put the group in
   `actor.external.name`.

### 2. Map to the VERIS schema

Build the JSON object using `vcdb-merged.json` as the source of truth for
field names and **allowed enum values** (never invent an enum value — if a
concept isn't in the enum, use the closest `Other`/`Unknown` member and explain
in `plus.analyst_notes`). Cover at minimum the schema's required top-level keys:
`incident_id`, `security_incident`, `summary`, `actor`, `action`,
`asset`, `attribute` (when there was data disclosure), `discovery_method`,
`timeline`, and `schema_version`.

### VERIS coding rules from the Coding Style Guide (apply these)

- **Never speculate.** Code only what the sources state; use `Unknown` rather
  than guessing a value. The DBIR team's rule: "we try not to do that."
- **Trust specific attacker-claimed details over `Unknown`.** When the *only*
  source for a detail is the attacker (a leak-site post, ransom note, or
  interview) and the victim hasn't confirmed it, still prefer the attacker's
  **specific** value to a blank `Unknown` — e.g. code `action.hacking.variety`
  /`vector` (`Use of stolen creds`, etc.), the asset hosting, and the
  exfiltration scope from the attacker's claim. A specific value is more useful
  than `Unknown`, and the record can be revised if a later source contradicts
  it. This is not "speculation" — it is coding what a source (the attacker)
  stated. **Always note in `plus.analyst_notes` that the detail is
  attacker-sourced and not victim-confirmed.** (Distinct from attribution rule
  #5 below, which governs *who* the actor was.)
- **VERIS is actor-centric, not data-location-centric.** Decide the actor by who
  *performed the breaching action* relative to the victim org:
  - Works for the victim org → **internal** (includes on-prem individual
    contractors treated as staff).
  - Doesn't work for the victim, but works for a business/partner that the victim
    engaged → **partner**.
  - Otherwise → **external** (even if the *vector* was a partner).
  A third party holding the victim's data being breached does NOT make it a
  partner-actor breach unless the actor worked for that partner.
  - **Actor orientation ≠ which org is the primary victim.** Concluding the
    actor is `external` does *not* make the org whose data sat there the primary
    `victim`. Actor orientation and *whose perspective you code the incident
    from* (the `victim` block) are independent decisions — check the
    provider-breach rule below before setting `victim`.
- **Do not invent an Error actor/action for "failure to implement a control"**
  (e.g. "they didn't patch"). Only code overt actions that directly caused the
  breach. Multiple actors require actual collusion with intent.
- **Motive may be inferred** from the nature of the attack even when the actor is
  unknown — mass data theft / ransom demands ⇒ `motive: ["Financial"]`. A
  process-driven, repeat-MO crew (ransomware/extortion gangs) ⇒
  `variety: ["Organized crime"]` (this does NOT mean the mafia). Errors and
  force-majeure ⇒ `motive: ["NA"]`.
- **`data_disclosure` is graded:** `"Yes"` when confidentiality is *confirmed*
  compromised — this includes not just directly-observed viewing/copying but
  also **confirmed unauthorized access to a live system/account that holds the
  data** (e.g. a compromised login, an attacker with confirmed access to a
  server, mailbox, or database) or **confirmed credential compromise** used to
  reach data — access to the system is itself sufficient to code `"Yes"`, don't
  hold out for explicit proof the attacker opened/exfiltrated specific files.
  Reserve `"Potentially"` / at-risk for cases where access itself is
  unconfirmed or the exposure is passive — e.g. a stolen but only
  password-protected (unencrypted) device with no evidence it was ever
  unlocked, or ransomware with no evidence of access to data beyond
  encryption. Paper documents lost/stolen/misdelivered are treated as
  **confirmed** (someone must read them to identify them). Encrypted-and-no-
  passphrase device ⇒ `"No"`.
- **Discovery method for actor-publicized incidents = `external` →
  `["Actor disclosure"]`** — ransomware ransom notes, extortion demands, leak-site
  posts, or any case the attacker announced. Use `internal` only when the victim's
  own controls/people detected it, `partner` when an outsourced provider did, and
  `unknown` only when truly unstated.
- **Assets are hierarchical:** selecting a child implies its parent (e.g.
  `U - Desktop or laptop` is the parent of `U - Laptop`); when sources don't
  distinguish, code the parent. People are assets in social attacks (`P - ...`).
- **Third-party / supply-chain / provider breaches — code from the provider's
  perspective.** When the breached entity is a **shared service provider**
  (MSP/MSSP, IT contractor, hosting/SaaS vendor, billing or processing firm) and
  the compromise reaches its customers — **especially when more than one customer
  org is hit, or a shared credential/tool/system common to its clientele was the
  point of compromise** — code **ONE** incident with the **provider as the
  primary `victim`**, not the customer:
  - `victim.victim_id`, `victim.industry`, `victim.government`,
    `victim.employee_count`, and `victim.state` all describe the **provider**
    (e.g. NAICS `541512` Computer Systems Design, *not* the customer's NAICS).
  - List every affected customer org in `victim.secondary.victim_id` as
    `"OrgName; NAICS"` strings.
  - The attacker who breached the provider is still `actor.external` (the
    actor-centric rule stands); `action.*.vector: ["Partner"]` captures that the
    impact propagated through the provider relationship. Do **not** create one
    incident per customer (it inflates counts).
  - **Recognition signals** (these outweigh which org the news story centers on):
    a provider's credentials/tooling described as *reused across its clientele*;
    multiple client orgs affected; a lawsuit or breach notice naming the provider
    as the failing party. When you see these, the provider is the primary victim
    even if the article is framed around one angry customer.
- **`source_id`** = `"vcdb"` (lowercase) for these incidents — match the corpus
  (the validated files and `vcdb-merged.json` use lowercase; `source_id` has no
  enum constraint, so case is not auto-corrected).
- **`security_incident`**: `"Confirmed"` for a real incident, `"Suspected"` if
  unsure, plus `"Near Miss"` / `"False Positive"` as applicable.

Guidance:
- `incident_id` and `plus.master_id`: a **newly generated uppercase UUID**
  (`python3 -c "import uuid; print(str(uuid.uuid4()).upper())"`). This is also
  the filename.
- `security_incident`: usually `"Confirmed"`.
- `summary`: a concise prose summary of the breach.
- `victim.industry`: the NAICS code from the issue label when present; also set
  `victim.country`, `victim.victim_id` (org name) when known, and
  `victim.employee_count` per the lookup in Step 1 ("Look up the victim's
  employee count") — do not skip the search just because the issue/sources
  don't state it outright.
- `action` / `actor` / `asset` / `attribute`: populate from the sources.
- `actor.<orientation>.country`: set it (an array of ISO country codes) when the
  sources reveal the actor's location; otherwise code `["Unknown"]`.
- **`action.<category>.result`:** tag the outcome(s) each action achieved, from
  the enum `Infiltrate`, `Exfiltrate`, `Elevate`, `Lateral movement`,
  `Deploy payload`, `Persist` (`Other` / `Unknown` / `NA` as needed). Common
  cases: an intrusion that achieved entry → `["Infiltrate"]`; data theft → add
  `"Exfiltrate"` to the action that stole it (e.g.
  `action.hacking.result: ["Infiltrate", "Exfiltrate"]`). This mirrors the
  `event_chain` arc — keep the two consistent. Omit `result` for an action whose
  outcome is unclear rather than guessing.
- `timeline.incident.year` (and month/day if known) = the date the incident
  **began** (initial access / earliest compromise), **not** the disclosure date;
  this is the basis for `plus.dbir_year` (derived per the DBIR-year rule below).
  Record the access-to-discovery gap in
  `timeline.compromise` (a duration). **Gotcha:** only `timeline.incident` is a
  *date* (`year`/`month`/`day`). `timeline.discovery`, `compromise`,
  `exfiltration`, and `containment` are **duration** objects `{unit, value}`
  (`unit` ∈ Seconds…Years / Never / NA / Unknown) — never put a year/month there.
- **Extortion:** code `action.social.variety` to include `"Extortion"` whenever
  the sources document an actual ransom / extortion **demand** (a threat to
  sell, publish, or leak data, or a ransom figure) — *regardless of whether
  malware/ransomware was involved*. Do **not** add Extortion merely because
  ransomware is present (corpus analysis shows the team codes Extortion on only
  ~2% of ransomware incidents but does use it for hacking/data-theft extortion).
  `"Extortion"` lives only under `action.social.variety`. **Whenever you set any
  `action.social` block (Extortion, Phishing, Pretexting, etc.) you MUST also do
  all three of the following** — they are enforced by the semantic lint in Step 5:
  - (a) include `target` and `vector` arrays — use `["Unknown"]` if the sources
    don't say who was targeted or how the demand was delivered;
  - (b) add an `attribute.integrity` block whose `variety` includes
    `"Alter behavior"`. A social action is by definition an attempt to influence
    or alter human behavior, so it always carries this integrity impact. Code it
    **even when the attempt failed** (e.g. a ransom demand that was refused) — note
    the refusal in `plus.analyst_notes` rather than dropping the attribute;
  - (c) add a People asset to `asset.assets`: a `"P - …"` variety for the targeted
    person, using `"P - Unknown"` if the role is unspecified.
- **Data scope:** code the full claimed scope of exfiltrated data in
  `attribute.confidentiality.data[].variety`, not just one category — e.g.
  `Medical`, `Personal`, `Source code`, `Secrets` (trade secrets / unreleased
  R&D) as applicable.
- **`confidentiality.state`:** whenever you code `confidentiality.data`, set
  `attribute.confidentiality.state` (an array) — the storage/transmission state
  of the breached data. **Default to `"Stored"`** for an at-rest breach when the
  sources don't state the encryption status — do **not** assume
  `"Stored unencrypted"`. Use `"Stored unencrypted"` / `"Stored encrypted"` only
  when a source actually indicates the encryption status, `"Printed"` for paper
  documents, `"Transmitted unencrypted"` / `"Transmitted encrypted"` for data
  intercepted in transit, and `"Unknown"` only when the state is truly unstated.
- **`data_total`:** only set it when you have a defensible total across *all*
  victim groups. If only a partial count is known (e.g. patients but not
  employees), **omit `data_total`** and explain in `plus.analyst_notes` rather
  than logging a misleadingly low number.

### Cross-field consequences of specific actions/varieties (enforced by the lint in Step 5)

Certain codings imply others must also be present — set both, don't stop at
the trigger value. These are ported from the upstream VERIS `rules.py`
enrichment conventions, adapted to this repo's current `vcdb-merged.json`
field names where they've drifted from what `rules.py` assumes (noted below).
The `value_chain`-based rules in `rules.py` (Phishing/C2/Ransomware/Email →
`value_chain.*`) are intentionally **not** ported, since `value_chain` is
deprecated for VCDB coding (see Step 5, check 5).

- **Ransomware → both an integrity and an availability impact.** Whenever
  `action.malware.variety` includes `"Ransomware"`, also code
  `attribute.integrity.variety` to include `"Interruption"` (the ransomware
  altered/interrupted normal system operation) **and**
  `attribute.availability.variety` to include `"Obscuration"` (the data was
  rendered inaccessible/encrypted, not merely lost) — in addition to whatever
  else the malware achieved.
- **Malware → integrity "Software installation".** Any `action.malware` block
  implies `attribute.integrity.variety` includes `"Software installation"`.
- **SQLi → integrity "Repurpose".** `action.hacking.variety` including
  `"SQLi"` implies `attribute.integrity.variety` includes `"Repurpose"`.
- **Physical theft or error-loss → availability "Loss".**
  `action.physical.variety` including `"Theft"`, or `action.error.variety`
  including `"Loss"`, implies `attribute.availability.variety` includes
  `"Loss"`.
- **Web application hacking vector → an asset for it.**
  `action.hacking.vector` including `"Web application"` implies
  `asset.assets` includes a `"S - Web application"` entry.
- **DoS malware → a Secondary motive.** `action.malware.variety` including
  `"DoS"` implies the acting party's `motive` (whichever of
  `actor.external`/`actor.internal`/`actor.partner` is populated) includes
  `"Secondary"`, in addition to any other motive already coded.
- **Sum/max consistency:** `impact.overall_amount`, if set, must be at least
  the sum of `impact.loss[].amount`; `attribute.confidentiality.data_total`,
  if set, must be at least the max of `attribute.confidentiality.data[].amount`;
  `victim.secondary.amount` must be at least the number of entries in
  `victim.secondary.victim_id`.

**Enumeration hierarchies — selecting a child value also requires its parent
value** (do not code only the most specific term):

| Field | Child(ren) | Parent to also include |
|---|---|---|
| `attribute.confidentiality.state` | `Stored encrypted`, `Stored unencrypted` | `Stored` |
| `attribute.confidentiality.state` | `Transmitted encrypted`, `Transmitted unencrypted` | `Transmitted` |
| `action.malware.variety` | `Click fraud`, `Cryptocurrency mining` | `Click fraud and cryptocurrency mining` |
| `action.malware.variety` | `Backdoor`, `C2` | `Backdoor or C2` |
| `action.malware.variety` | `Backdoor` + `Trojan` together | `RAT` (and `RAT` implies both `Backdoor` and `Trojan`) |
| `action.malware.vector` | `Web application - download`, `Web application - drive-by` | `Web application` |
| `action.malware.vector` | `Email attachment`, `Email autoexecute`, `Email link`, `Email other`, `Email unknown` | `Email` |
| `action.hacking.variety` | any exploit-style variety (`SQLi`, `XSS`, `Buffer overflow`, `CSRF`, `Path traversal`, `Insecure deserialization`, etc.) | `Exploit vuln` |
| `asset.assets[].variety` | `U - Desktop`, `U - Laptop` | `U - Desktop or laptop` |
| `action.social.target` | `End-user`, `Other employee` | `End-user or employee` |
| `attribute.confidentiality.data[].variety` | `Medical`, `Sensitive Personal`, `Bank`, `Payment` | `Personal` |
| `attribute.confidentiality.data[].variety` | `API key`, `Digital certificate`, `Multi-factor credential`, `Session key` | `Credentials` |
| `attribute.integrity.variety` | `Register MFA device`, `Created account` | `Modify authentication` |

Note two adaptations from upstream `rules.py`: the Stored/Transmitted
hierarchy lives under `attribute.confidentiality.state` in this repo's schema,
not `confidentiality.variety` as `rules.py` assumes; and the Email vector
children live under `action.malware.vector`, not `action.malware.variety`.
`rules.py`'s malware→`Exploit vuln` rule (triggered by `Remote injection` /
`Web application - Web drive-by`) is not ported — those enum values no longer
exist in this schema.

### Building `plus.event_chain` (the attack story)

`plus.event_chain` is a **schema-validated** array that decomposes the incident
into ordered steps — the kill chain in sequence. Populate it whenever the
incident has more than one phase (almost all ransomware, hack-and-extort, and
multi-action incidents). A single-phase incident may have a one-event chain.

Each event is an object using **abbreviated** enums (no other keys allowed):

- `action`: `hak` `mal` `soc` `mis` `err` `phy` `env` `unk`
- `actor`:  `ext` `int` `prt` `unk`
- `asset`:  `srv` (server) `usr` (user device) `ppl` (person) `net` `med` `ter`
  `emb` `unk`
- `attribute`: `ia` (integrity/authenticity), `cp` (confidentiality/possession),
  `au` (availability/utility), `unk` — VERIS pairs each CIA element with its
  Parkerian Hexad counterpart, so e.g. `cp` covers loss of possession/control
  over data even without confirmed viewing/disclosure.
- `summary`: short plain-English naming the VERIS variety for that step
  (e.g. "Use of stolen creds", "Ransomware installed", "Data copied",
  "Extortion for payment").

**Sequencing rules**

1. **Order = chronology**: initial access first, business impact last.
2. **Attribute arc** tells the story: getting in / installing tooling / coercing
   = `ia`; data accessed or copied = `cp`; encryption, outage, or destruction =
   `au`. Most ransomware chains end on a `mal/.../au` event.
3. **Asset per step**: social steps (phishing, extortion) → `ppl`; endpoint
   malware → `usr`; server compromise/encryption/exfil → `srv`. (The `…/ppl/ia`
   social step satisfies the same logic as the Alter-behavior + People-asset
   rule above.)
4. **Use `unk` for genuinely unknown steps — including the attribute.** When
   the entry vector is undisclosed, the attribute is *also* unknown: code
   `unk/ext/srv/unk` ("initial access method not disclosed"), **not**
   `unk/ext/srv/ia`. Only use `ia` on an access step when a source actually
   supports an integrity impact for that step (e.g. a confirmed unauthorized
   modification) — don't default to `ia` just because "getting in" sounds
   integrity-shaped. **Do NOT default to `soc/phish`** when the entry vector is
   unconfirmed. Code only what sources support; over-coding is worse than
   honest gaps. (The "never speculate" rule applies here too. A reviewer
   flagged this exact `.../ia` default in PR #23592 — an unknown vector should
   read as `unk/ext/srv/unk`, and the same applies even when the *action*
   category is known, e.g. `hak/ext/srv/unk`, if the specific attribute isn't
   established.)
5. **Known-campaign TTPs**: for a named malware/crew with a well-documented chain
   (MOVEit/Clop web shell, DarkSide/Ryuk kill chain), you may code the
   established steps even if one article omits them — but only steps that are
   well-established for that campaign; otherwise `unk`.
6. **Stay consistent with the main blocks — verify this explicitly before
   writing the file, do not just aim for it while drafting.** Every `action`
   category and `attribute` you use in the chain should also appear in the
   top-level `action.*` / `attribute.*` blocks, **and vice versa**: after
   drafting `plus.event_chain`, list every top-level `attribute.*` block you
   coded (e.g. `attribute.integrity`, `attribute.confidentiality`,
   `attribute.availability`) and confirm at least one chain event carries the
   matching abbreviated code (`ia`/`cp`/`au`). A missed case seen in review:
   ransomware installation coded an `attribute.integrity` impact at the top
   level, but the chain step for installing the ransomware was left without
   an `ia` event — if the attribute section has it, the chain must account for
   it.
7. **Unknown middle steps are allowed.** An `unk` event may appear at any
   position — including between two known steps. When you know the initial entry
   and the business impact but the middle is undocumented, insert an explicit
   bridge event `unk/ext/unk/unk` (use `…/unk/cp` if data demonstrably left the
   org but the mechanism is unknown) to signal "a step occurred here but is
   undocumented." Never replace an unknown step with a *specific* action you
   can't cite (see rule #4). A short, partly-`unk` chain is more honest than a
   fabricated complete one.

**Canonical templates**

- *Ransomware w/ exfiltration:*
  `hak|soc /ext/ srv|ppl /ia` (access) → `mal/ext/srv/ia` (ransomware installed)
  → `mal/ext/srv/cp` (data copied) → `mal/ext/srv/au` (encrypted)
- *Hack-and-extort, no malware:*
  `hak/ext/srv/ia` (access) → `hak/ext/srv/cp` (data stolen)
  → `soc/ext/ppl/ia` (extortion demand)
- *Web-exploit data theft (MOVEit-style):*
  `hak/ext/srv/ia` (vuln exploited) → `mal/ext/srv/ia` (web shell installed)
  → `mal/ext/srv/cp` (data stolen) → `soc/ext/ppl/ia` (extortion)

### 3. Handle unknowns automatically (no pausing)

For any field the sources don't reveal, fill the schema's `"Unknown"` (or
`"Other"`) enum value rather than omitting required structure, and record each
assumption or guess in **`plus.analyst_notes`**. Do not stop to ask the user
about data gaps — only ask for the analyst handle if it is missing.

### 4. Fill the plus.* metadata block (what you can)

- `plus.master_id` = the incident_id UUID.
- `plus.analyst` = the provided/asked GitHub handle.
- `plus.sub_source` = `"vcdb"` unless the issue indicates otherwise.
- `plus.analysis_status` = `"First pass"` — the corpus-standard marker for an
  initial, not-yet-reviewed encoding, which is exactly what the `submitted/`
  stage means. (`"submitted"` is **not** a valid enum value; the allowed values
  are `In-progress`, `Ready for review`, `First pass`, `Reviewed`, `Finalized`,
  `Ineligible`. Do **not** use `"Reviewed"` — that is reserved for records a
  human has reviewed.)
- `plus.dbir_year` = the **DBIR reporting year** the incident falls into — which
  report subsets the data, **not** the calendar year of the incident. A DBIR year
  *N* covers the window **Nov 1 of (N−2) through Oct 31 of (N−1)**; the boundary
  flips on **Nov 1**. Derive it from the **timeline**, normally the incident
  (begin) date:
  - Incident date in **Jan–Oct** of year *Y* (or **year-only**, which you treat as
    Jan 1) → `dbir_year = Y + 1`. (E.g. an incident anywhere in 2023 → `2024`;
    an incident on Oct 2 2024 → `2025`.)
  - Incident date in **Nov or Dec** of year *Y* (i.e. past the Oct 31 cutoff) →
    `dbir_year = Y + 2`. (E.g. Nov 1 2024 → `2026`.)
  - **Derive from a later timeline anchor when the incident date is imprecise.**
    If you only have a year for the incident but the discovery / public-disclosure
    date (e.g. when it was posted to HHS or another `.gov`) is more precise and
    later, derive `dbir_year` from that later date using the same Nov 1 / Oct 31
    window. A `dbir_year` *later* than the incident-date minimum is expected and
    fine in that case; a `dbir_year` *earlier* than the minimum is impossible (the
    validation rejects it).
- `plus.created` and `plus.modified` = current UTC timestamp in
  `YYYY-MM-DDTHH:MM:SSZ` form (get it with
  `python3 -c "import datetime; print(datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))"`).
- `plus.github` = the issue number from the URL **as a string** (e.g.
  `"23372"`, not the integer — the schema requires a string here).
- `plus.analyst_notes` = assumptions, unknown fields, and sources consulted.
  **The notes MUST begin with these two lines, in order, before any other text:**
  1. `Closes <issue URL>` — the full GitHub issue URL this record encodes
     (e.g. `Closes https://github.com/vz-risk/VCDB/issues/23372`), so a reviewer
     can copy/paste it to check the work against the source issue.
  2. `Encoded by AI — encode-veris-incident skill version 20260731T234508Z`
     (use the **Skill version** string from the top of this file verbatim), so
     reviewers know the record was AI-generated and by which skill revision.

  Then continue with the assumptions / unknowns / sources narrative.
- `plus.event_chain` = the ordered attack story when the incident has more than
  one phase (ransomware, hack-and-extort, multi-action). Build it per the
  **"Building `plus.event_chain`"** subsection above.
- `plus.attribute.confidentiality.data_abuse` — **optional**; the schema defines
  it as whether *"the data was used for fraud, used mischievously, used
  maliciously, or otherwise abused"* — i.e. the breached data was actually
  **misused after disclosure**, *not* merely exposed. It is a sub-field of the
  confidentiality attribute, so two rules govern whether to code it at all:
  - **Only code it when confidentiality was an affected attribute** (the record
    has an `attribute.confidentiality` block / data was disclosed). It must
    **never** appear on an availability-only or no-confidentiality incident
    (e.g. ransomware-nobreach) — that is an invalid record and the lint rejects
    it. The `plus.*` block describing data abuse only makes sense if there is
    real-attribute confidentiality impact to describe.
  - **It is not required and most records omit it** — the corpus sets it on only
    ~1/3 of confidentiality breaches. Do **not** add a placeholder `"Unknown"`
    just to populate the field. Code it only when a source actually says
    something about downstream use of the data; otherwise leave it out entirely.
  - **Values, when you do code it:** `"Yes - Data ransomed"` when there is an
    extortion/ransom or leak-site component; `"Yes - Identity theft"`,
    `"Yes - Financial fraud"`, or `"Yes - Posted on personal forum"` only when a
    source confirms that specific downstream abuse; bare `"Yes"` if abuse is
    confirmed but unspecified; `"No"` only if a source states the data was not
    misused; `"Unknown"` only when you have a specific reason to record the
    question as explicitly open. Never code a `Yes`-family value just because
    data was stolen — abuse must be supported, and any `Yes`-family value
    requires `confidentiality.data_disclosure == "Yes"`. When
    `action.social.variety` includes `"Extortion"` (or there is a ransom /
    leak-site component), prefer the specific `"Yes - Data ransomed"` over a
    bare `"Yes"`.
- Leave other `plus.*` fields out unless the sources support them.
- Do **not** include a top-level `value_chain` block — it is a
  deprecated/auto-derived VERIS section the team no longer encodes. Omit it
  entirely, even if a fetched template or example contains one.
- Set top-level `schema_name` to `"vcdb"` (always).
- Set top-level `confidence` from **(a) completeness of the 4 A's** and **(b)
  source quality** (enum: `High` / `Medium` / `Low` / `None`):
  - **`High`** — all four A's (Actor, Action, Asset, Attribute) are established
    from the sources **and** at least one reputable source backs it (security
    press such as BleepingComputer / SecurityWeek / The Record, vendor or
    incident-response advisories, an official victim notice, or mainstream news).
  - **`Medium`** — key fields are missing/`Unknown`, **or** the reporting is
    plausible but thinly sourced (e.g. a single personal blog).
  - **`Low`** — sparse, largely uncorroborated, or many core fields `Unknown`.
  - **`None`** — essentially unsupported (rare).
  When torn between two levels, choose the **lower** — do not inflate to `High`
  just because the record validates.
- Set top-level `schema_version` to the value used by existing
  `data/json/validated/` files (read one to confirm; do not hardcode blindly).

### 5. Validate against the schema (required)

Validate the object against `vcdb-merged.json` with `jsonschema`. It is not
installed by default, so install it quietly first:

```bash
python3 -m pip install --quiet jsonschema
```

**Both stages are bundled in a script** so the checks are byte-identical on
every run (do **not** re-type the lint logic inline). The script runs the
semantic lint FIRST, then the schema validation, and prints `LINT OK` then
`VALID` on success. Run it (paths are relative to the repo root; the script
auto-locates `vcdb-merged.json`, so it also works run from `bin/`):

```bash
python3 .claude/skills/encode-veris-incident/scripts/validate.py \
  data/json/submitted/<UUID>.json
```

**What the lint covers (Stage 1).** These are cross-field coding-correctness
checks the JSON schema cannot express (a record can be schema-valid yet
mis-coded — e.g. a social action with no `Alter behavior` integrity impact and
no People asset). It also confirms the fields this skill is responsible for are
**present and internally consistent** (`confidentiality.state`, `confidence`,
`schema_name`/`source_id`, `analysis_status`, the `Closes` note), validates
optional fields **if present** (`data_abuse` must be a valid enum value and may
only appear when confidentiality was an affected attribute — it is *not*
required on every record), and flags over-code patterns (e.g. "abuse confirmed"
with no disclosure, an `Exfiltrate` result with no disclosure). It also
double-checks `plus.dbir_year` against the incident date using the Nov 1 / Oct 31
DBIR-year window (it rejects a `dbir_year` that is impossibly *early* for the
incident begin date; a later one, derived from a later discovery/disclosure date,
is allowed). `LINT WARN` lines are non-fatal
judgment calls to reconsider or justify in `analyst_notes`. **The lint cannot
detect speculation** — only you can ensure every non-`Unknown` value is
source-backed and that assumptions are recorded in `plus.analyst_notes`.

The script exits non-zero on the first stage that fails:
- `LINT FAIL:` (exit 1) — fix every listed item yourself (do not auto-stuff
  placeholder values blindly — pick the correct value) and re-run.
- a `jsonschema` error (exit 1) — usually a wrong enum value or missing
  required field; fix and re-run.
- exit 2 — `jsonschema` not installed (`python3 -m pip install --quiet
  jsonschema`, per above) or the schema file could not be located (pass
  `--schema <path-to-vcdb-merged.json>`).

Only write/keep the file once the script prints **both** `LINT OK` and `VALID`.
The lint rules themselves live in `scripts/validate.py`; if you need to change a
check, edit that file (it is version-agnostic and needs no skill-version bump).

**Known required-field gotchas (set these up front to avoid re-validation loops):**
- `victim` requires `government` — an **array**; use `["NA"]` for a private,
  non-government company.
- Any `action.social` block requires both `target` and `vector` (arrays).
- `asset` requires **`cloud`** (an array, inherited from upstream VERIS) in
  addition to `assets`. Valid values: `"On-Premise Asset(s)"`,
  `"External Cloud Asset(s)"`, `"Other"`, `"Unknown"`, `"NA"`. When sources name
  cloud-hosted assets/services (SaaS, Azure/AWS/GCP, a GitHub repo, a cloud
  container registry, etc.), code `"External Cloud Asset(s)"` — and combine with
  `"On-Premise Asset(s)"` when both are involved. Use `["On-Premise Asset(s)"]`
  only for clearly on-prem infrastructure, and `["Unknown"]` when hosting is
  genuinely unclear (don't reflexively default to on-prem).
- `plus.github` must be a **string**.
- Most enumerated fields are **arrays** even when there is one value
  (`victim.government`, `victim.country`, `actor.*.variety/motive/name`, etc.).
- Required top-level keys include `incident_id`, `security_incident`, `summary`,
  `actor`, `action`, `asset`, `discovery_method`, `timeline`, `schema_version`.
- Use `schema_version` `"1.4.0"` (the corpus standard) unless a validated file
  shows otherwise.

### 6. Write the file and report

- Write the validated JSON (pretty-printed, 2-space indent, sorted keys is fine)
  to `data/json/submitted/<UUID>.json`.
- Report to the user: the file path, the generated `incident_id`, the sources
  consulted, and a short bullet list of the fields you left `Unknown`/guessed
  (mirror of `plus.analyst_notes`) so they can refine if desired.

## Notes

- This skill is local-only (excluded via `.git/info/exclude`) and must not be
  committed or pushed.
- `data/json/submitted/` is the correct stage: these incidents are generated
  but not yet manually/automatically validated into `validated/`.
