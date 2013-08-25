victim_count = 1;
source_count = 1;
data_variety_count = 1;
isoCurrencyCodes = ['AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTN', 'BWP', 'BYR', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LTL', 'LVL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRO', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLL', 'SOS', 'SPL', 'SRD', 'STD', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TVD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VEF', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XDR', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMK', 'ZWD'];
isoCountryCodes = {'BD': 'BANGLADESH', 'BE': 'BELGIUM', 'BF': 'BURKINA FASO', 'BG': 'BULGARIA', 'BA': 'BOSNIA AND HERZEGOVINA', 'BB': 'BARBADOS', 'WF': 'WALLIS AND FUTUNA', 'BL': 'SAINT BARTH\xc3\x89LEMY', 'BM': 'BERMUDA', 'BN': 'BRUNEI DARUSSALAM', 'BO': 'BOLIVIA, PLURINATIONAL STATE OF', 'BH': 'BAHRAIN', 'BI': 'BURUNDI', 'BJ': 'BENIN', 'BT': 'BHUTAN', 'JM': 'JAMAICA', 'BV': 'BOUVET ISLAND', 'BW': 'BOTSWANA', 'WS': 'SAMOA', 'BQ': 'BONAIRE, SINT EUSTATIUS AND SABA', 'BR': 'BRAZIL', 'BS': 'BAHAMAS', 'JE': 'JERSEY', 'BY': 'BELARUS', 'BZ': 'BELIZE', 'RU': 'RUSSIAN FEDERATION', 'RW': 'RWANDA', 'RS': 'SERBIA', 'TL': 'TIMOR-LESTE', 'RE': 'R\xc3\x89UNION', 'TM': 'TURKMENISTAN', 'TJ': 'TAJIKISTAN', 'RO': 'ROMANIA', 'TK': 'TOKELAU', 'GW': 'GUINEA-BISSAU', 'GU': 'GUAM', 'GT': 'GUATEMALA', 'GS': 'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS', 'GR': 'GREECE', 'GQ': 'EQUATORIAL GUINEA', 'GP': 'GUADELOUPE', 'JP': 'JAPAN', 'GY': 'GUYANA', 'GG': 'GUERNSEY', 'GF': 'FRENCH GUIANA', 'GE': 'GEORGIA', 'GD': 'GRENADA', 'GB': 'UNITED KINGDOM', 'GA': 'GABON', 'GN': 'GUINEA', 'GM': 'GAMBIA', 'GL': 'GREENLAND', 'GI': 'GIBRALTAR', 'GH': 'GHANA', 'OM': 'OMAN', 'TN': 'TUNISIA', 'JO': 'JORDAN', 'HR': 'CROATIA', 'HT': 'HAITI', 'HU': 'HUNGARY', 'HK': 'HONG KONG', 'HN': 'HONDURAS', 'HM': 'HEARD ISLAND AND MCDONALD ISLANDS', 'VE': 'VENEZUELA, BOLIVARIAN REPUBLIC OF', 'PR': 'PUERTO RICO', 'PS': 'PALESTINE, STATE OF', 'PW': 'PALAU', 'PT': 'PORTUGAL', 'KN': 'SAINT KITTS AND NEVIS', 'PY': 'PARAGUAY', 'IQ': 'IRAQ', 'PA': 'PANAMA', 'PF': 'FRENCH POLYNESIA', 'PG': 'PAPUA NEW GUINEA', 'PE': 'PERU', 'PK': 'PAKISTAN', 'PH': 'PHILIPPINES', 'PN': 'PITCAIRN', 'PL': 'POLAND', 'PM': 'SAINT PIERRE AND MIQUELON', 'ZM': 'ZAMBIA', 'EH': 'WESTERN SAHARA', 'EE': 'ESTONIA', 'EG': 'EGYPT', 'ZA': 'SOUTH AFRICA', 'EC': 'ECUADOR', 'IT': 'ITALY', 'VN': 'VIET NAM', 'SB': 'SOLOMON ISLANDS', 'ET': 'ETHIOPIA', 'SO': 'SOMALIA', 'ZW': 'ZIMBABWE', 'SA': 'SAUDI ARABIA', 'ES': 'SPAIN', 'ER': 'ERITREA', 'ME': 'MONTENEGRO', 'MD': 'MOLDOVA, REPUBLIC OF', 'MG': 'MADAGASCAR', 'MF': 'SAINT MARTIN (FRENCH PART)', 'MA': 'MOROCCO', 'MC': 'MONACO', 'UZ': 'UZBEKISTAN', 'MM': 'MYANMAR', 'ML': 'MALI', 'MO': 'MACAO', 'MN': 'MONGOLIA', 'MH': 'MARSHALL ISLANDS', 'MK': 'MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF', 'MU': 'MAURITIUS', 'MT': 'MALTA', 'MW': 'MALAWI', 'MV': 'MALDIVES', 'MQ': 'MARTINIQUE', 'MP': 'NORTHERN MARIANA ISLANDS', 'MS': 'MONTSERRAT', 'MR': 'MAURITANIA', 'IM': 'ISLE OF MAN', 'UG': 'UGANDA', 'TZ': 'TANZANIA, UNITED REPUBLIC OF', 'MY': 'MALAYSIA', 'MX': 'MEXICO', 'IL': 'ISRAEL', 'FR': 'FRANCE', 'AW': 'ARUBA', 'SH': 'SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA', 'SJ': 'SVALBARD AND JAN MAYEN', 'FI': 'FINLAND', 'FJ': 'FIJI', 'FK': 'FALKLAND ISLANDS (MALVINAS)', 'FM': 'MICRONESIA, FEDERATED STATES OF', 'FO': 'FAROE ISLANDS', 'NI': 'NICARAGUA', 'NL': 'NETHERLANDS', 'NO': 'NORWAY', 'NA': 'NAMIBIA', 'VU': 'VANUATU', 'NC': 'NEW CALEDONIA', 'NE': 'NIGER', 'NF': 'NORFOLK ISLAND', 'NG': 'NIGERIA', 'NZ': 'NEW ZEALAND', 'NP': 'NEPAL', 'NR': 'NAURU', 'NU': 'NIUE', 'CK': 'COOK ISLANDS', 'CI': "C\xc3\x94TE D'IVOIRE", 'CH': 'SWITZERLAND', 'CO': 'COLOMBIA', 'CN': 'CHINA', 'CM': 'CAMEROON', 'CL': 'CHILE', 'CC': 'COCOS (KEELING) ISLANDS', 'CA': 'CANADA', 'CG': 'CONGO', 'CF': 'CENTRAL AFRICAN REPUBLIC', 'CD': 'CONGO, THE DEMOCRATIC REPUBLIC OF THE', 'CZ': 'CZECH REPUBLIC', 'CY': 'CYPRUS', 'CX': 'CHRISTMAS ISLAND', 'CR': 'COSTA RICA', 'CW': 'CURA\xc3\x87AO', 'CV': 'CAPE VERDE', 'CU': 'CUBA', 'SZ': 'SWAZILAND', 'SY': 'SYRIAN ARAB REPUBLIC', 'SX': 'SINT MAARTEN (DUTCH PART)', 'KG': 'KYRGYZSTAN', 'KE': 'KENYA', 'SS': 'SOUTH SUDAN', 'SR': 'SURINAME', 'KI': 'KIRIBATI', 'KH': 'CAMBODIA', 'SV': 'EL SALVADOR', 'KM': 'COMOROS', 'ST': 'SAO TOME AND PRINCIPE', 'SK': 'SLOVAKIA', 'KR': 'KOREA, REPUBLIC OF', 'SI': 'SLOVENIA', 'KP': "KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF", 'KW': 'KUWAIT', 'SN': 'SENEGAL', 'SM': 'SAN MARINO', 'SL': 'SIERRA LEONE', 'SC': 'SEYCHELLES', 'KZ': 'KAZAKHSTAN', 'KY': 'CAYMAN ISLANDS', 'SG': 'SINGAPORE', 'SE': 'SWEDEN', 'SD': 'SUDAN', 'DO': 'DOMINICAN REPUBLIC', 'DM': 'DOMINICA', 'DJ': 'DJIBOUTI', 'DK': 'DENMARK', 'VG': 'VIRGIN ISLANDS, BRITISH', 'DE': 'GERMANY', 'YE': 'YEMEN', 'DZ': 'ALGERIA', 'US': 'UNITED STATES', 'UY': 'URUGUAY', 'YT': 'MAYOTTE', 'UM': 'UNITED STATES MINOR OUTLYING ISLANDS', 'LB': 'LEBANON', 'LC': 'SAINT LUCIA', 'LA': "LAO PEOPLE'S DEMOCRATIC REPUBLIC", 'TV': 'TUVALU', 'TW': 'TAIWAN, PROVINCE OF CHINA', 'TT': 'TRINIDAD AND TOBAGO', 'TR': 'TURKEY', 'LK': 'SRI LANKA', 'LI': 'LIECHTENSTEIN', 'LV': 'LATVIA', 'TO': 'TONGA', 'LT': 'LITHUANIA', 'LU': 'LUXEMBOURG', 'LR': 'LIBERIA', 'LS': 'LESOTHO', 'TH': 'THAILAND', 'TF': 'FRENCH SOUTHERN TERRITORIES', 'TG': 'TOGO', 'TD': 'CHAD', 'TC': 'TURKS AND CAICOS ISLANDS', 'LY': 'LIBYA', 'VA': 'HOLY SEE (VATICAN CITY STATE)', 'VC': 'SAINT VINCENT AND THE GRENADINES', 'AE': 'UNITED ARAB EMIRATES', 'AD': 'ANDORRA', 'AG': 'ANTIGUA AND BARBUDA', 'AF': 'AFGHANISTAN', 'AI': 'ANGUILLA', 'VI': 'VIRGIN ISLANDS, U.S.', 'IS': 'ICELAND', 'IR': 'IRAN, ISLAMIC REPUBLIC OF', 'AM': 'ARMENIA', 'AL': 'ALBANIA', 'AO': 'ANGOLA', 'AQ': 'ANTARCTICA', 'AS': 'AMERICAN SAMOA', 'AR': 'ARGENTINA', 'AU': 'AUSTRALIA', 'AT': 'AUSTRIA', 'IO': 'BRITISH INDIAN OCEAN TERRITORY', 'IN': 'INDIA', 'AX': '\xc3\x85LAND ISLANDS', 'AZ': 'AZERBAIJAN', 'IE': 'IRELAND', 'ID': 'INDONESIA', 'UA': 'UKRAINE', 'QA': 'QATAR', 'MZ': 'MOZAMBIQUE'};

$('#btn_add_victim').click(function() {
    victim_count += 1;
    $('#victim_array').append('<hr style="clear:both;">');

    newvic = document.createElement("div");
    $(newvic).addClass("indented-fields pull-right");

    form_field = $("<div></div>").addClass("form-group");
    $(form_field).append("<label>Victim ID</label>");
    $(form_field).append($("<input>").attr({name:victim_count+"_victim_id",placeholder:"Proper name for the victim organization",required:true}).addClass("form-control"));
    $(newvic).append(form_field);

    form_field = $("<div></div>").addClass("form-group");
    $(form_field).append("<label>Number of Employees</label>");
    employeeCount = $("<select></select>").attr({name:victim_count+"_employee_count", required:true}).addClass("form-control");
    $(employeeCount).append("<option value=\"\" disabled selected>-- Please select --</option>");
    $(employeeCount).append("<option value=\"1 to 10\">1 to 10</option>");
    $(employeeCount).append("<option value=\"11 to 100\">11 to 100</option>");
    $(employeeCount).append("<option value=\"101 to 1000\">101 to 1,000</option>");
    $(employeeCount).append("<option value=\"Small\">Small (less than 1000 employees)</option>");
    $(employeeCount).append("<option value=\"Large\">Large (1,000 employees or more)</option>");
    $(employeeCount).append("<option value=\"1001 to 10000\">1,001 to 10,000</option>");
    $(employeeCount).append("<option value=\"10001 to 25000\">10,001 to 25,000</option>");
    $(employeeCount).append("<option value=\"25001 to 50000\">25,001 to 50,000</option>");
    $(employeeCount).append("<option value=\"50001 to 100000\">50,001 to 100,000</option>");
    $(employeeCount).append("<option value=\"Over 100000\">Over 100,000</option>");
    $(employeeCount).append("<option value=\"Unknown\">Unknown</option>");
    $(form_field).append(employeeCount);
    $(newvic).append(form_field);

    $(newvic).append("<label>Annual Revenue</label>");

    form_field = $("<div></div>").addClass("input-group");
    $(form_field).append("<input type=\"number\" name=\"revenue\" class=\"form-control\">");
    isoSpan = $("<span></span").addClass("input-group-addon");
    isoSelect = $("<select></select>").attr({name:victim_count+"_iso_currency_code"});
    isoSelect.append("<option value=\"USD\" selected>USD</option>");
    $.each(isoCurrencyCodes, function(key, value) {
        $(isoSelect).append("<option value=\""+ value + "\">" + value + "</option>"); });
    $(isoSpan).append(isoSelect);
    $(form_field).append(isoSpan);
    $(newvic).append(form_field);

    form_field = $("<div></div>").addClass("form-group");
    $(form_field).append("<label>Primary Industry</label>");
    $(form_field).append($("<input>").attr({type:"number",name:victim_count+"_industry", placeholder:"6 digit NAICS code"}).addClass("form-control"));
    $(newvic).append(form_field);

    form_field = $("<div></div>").addClass("form-group");
    $(form_field).append("<label>Country of Operation</label>");
    countryOps = $("<select></select>").attr({name:victim_count+"_country"}).addClass("form-control");
    $(countryOps).append("<option value=\"\" selected disabled>-- Please select--</option>");
    commonChoices = $("<optgroup></optgroup>").attr({label:"Common selections"});
    $(commonChoices).append("<option value=\"US\">United States of America</option>");
    $(commonChoices).append("<option value=\"Unknown\">Unknown</option>");
    allChoices = $("<optgroup></optgroup>").attr({label:"All countries"});
    $.each(isoCountryCodes, function(key, value) {
        $(allChoices).append("<option value=\"" + key + "\">" + value + "</option"); });
    $(countryOps).append(commonChoices);
    $(countryOps).append(allChoices);
    $(form_field).append(countryOps);
    $(newvic).append(form_field);

    form_field = $("<div></div>").addClass("form-group");
    $(form_field).append("<label>State/Region</label>");
    $(form_field).append($("<input>").attr({name:victim_count+"_state"}).addClass("form-control"));
    $(newvic).append(form_field);

    form_field = $("<div></div>").addClass("form-group");
    $(form_field).append("<label>Number of Locations Affected</label>");
    $(form_field).append($("<input>").attr({name:victim_count+"_locations_affected",type:"number"}).addClass("form-control"));
    $(newvic).append(form_field);

    form_field = $("<div></div>").addClass("form-group");
    $(form_field).append("<label>Victim Notes</label>");
    $(form_field).append($("<textarea>").attr({name:victim_count+"_victim_notes"}).addClass("form-control"));
    $(newvic).append(form_field);

    $('#victim_array').append(newvic);
});

$('#btn-add-source').click( function() {
    source_count += 1;
    newRow = $("<div></div>").addClass("row");
    newCol = $("<div></div>").addClass("col-md-8");
    newFields = $("<div></div>").addClass("form-controls");
    newFields.append("<label>Source URL</label>");
    newFields.append($("<input>").attr({name:source_count+"_source_url"}).addClass("form-control"));
    newCol.append(newFields);
    newRow.append(newCol);

    newCol = $("<div></div>").addClass("col-md-4");
    newFields = $("<div></div>").addClass("form-controls");
    newFields.append("<label>Date Retrieved</label>");
    newFields.append($("<input>").attr({name:source_count+"_source_retrieved"}).addClass("form-control"));
    newCol.append(newFields);
    newRow.append(newCol);
    $("#source-material").append(newRow);
});

$('#btn-add-data-variety').click( function() {
  data_variety_count += 1;
  newRow = $("<div></div>").addClass("row");
  newCol = $("<div></div>").addClass("col-md-8");
  newFields = $("<div></div>").addClass("form-group");
  newFields.append("<label>Variety</label>");

  dataVariety = $("<select></select>").attr({name:data_variety_count + "_data_variety", required:true}).addClass("form-control");
  dataVariety.append("<option value=\"\" selected disabled>-- Please Select --</option>");
  dataVariety.append("<option value=\"Credentials\">Authentication credentials</option>");
  dataVariety.append("<option value=\"Bank\">Bank account data</option>");
  dataVariety.append("<option value=\"Classified\">Classified information</option>");
  dataVariety.append("<option value=\"Copyrighted\">Copyrighted material</option>");
  dataVariety.append("<option value=\"Medical\">Medical records</option>");
  dataVariety.append("<option value=\"Payment\">Payment card data</option>");
  dataVariety.append("<option value=\"Personal\">Personal information</option>");
  dataVariety.append("<option value=\"Internal\">Sensitive organizational data</option>");
  dataVariety.append("<option value=\"System\">System information</option>");
  dataVariety.append("<option value=\"Secrets\">Trade secrets</option>");
  dataVariety.append("<option value=\"Unknown\">Unknown</option>");
  dataVariety.append("<option value=\"Other\">Other</option>");
  newFields.append(dataVariety);
  newCol.append(newFields);
  newRow.append(newCol);

  newCol = $("<div></div>").addClass("col-md-4");
  newFields = $("<div></div>").addClass("form-group");
  newFields.append("<label>Record count</label>");
  newFields.append($("<input>").attr({name:data_variety_count + "_data_count", required:true, type:"number"}).addClass("form-control"));
  newCol.append(newFields);
  newRow.append(newCol);
  $("#data-variety-array").append(newRow);
  $(data_variety_count+"_data_variety").focus();
});