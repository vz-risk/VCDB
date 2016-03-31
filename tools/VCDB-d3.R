library(verisr)
library(countrycode)
library(jsonlite)
library(plyr)
library(dplyr)
library(magrittr)
library(data.table)

# R code to generate data for the VCDB Explore vis
# paths will prbly need to change for folks until I 
# get the full Rproj uploaded
# the "timeline" scatterplot vis is not included


# add a "00" industry for unknown
data(industry2) 
industry2 %<>% rbind.data.frame(data.frame(code="00", title="Unknown/Unclassified", short="Unknown", stringsAsFactors=FALSE))

# if pre-gen'd, use the 'load' version
#vcdb <- json2veris("/Users/bob/Development/r/VCDB/data/json")
# save(vcdb, file = "data/q3-vcdb.rda")
load("data/q3-vcdb.rda")

# load("/Users/bob/Development/r/VCDB/data/verisr/vcdb.dat")

# we'll need this later
valid_naics <- c("00", "11", "21", "22", "23", "31", "32", "33", "42", "44", "45",
                 "48", "49", "51", "52", "53", "54", "55", "56", "61", "62", "71",
                 "72", "81", "92", "99")

# make the CSV for the victim count by industry

victim_industry <- getenum(vcdb, "victim.industry2") %>% 
  select(NAICS=enum, incidents=x) %>%
  mutate(NAICS=ifelse(NAICS %in% c("31", "32", "33"), "31", NAICS),
         NAICS=ifelse(NAICS %in% c("44", "45"), "44", NAICS),
         NAICS=ifelse(NAICS %in% c("48", "49"), "48", NAICS),
         NAICS=ifelse(NAICS %in% c("00", "99"), "00", NAICS)) %>%
  group_by(NAICS) %>%
  dplyr::count(NAICS, wt=incidents) %>%
  select(code=NAICS, n) %>%
  merge(industry2, all.x=TRUE) %>%
  filter(!is.na(title)) %>%
  select(NAICS=code, Industry=short, Count=n, Description=title) %>% arrange(NAICS)
write.csv(victim_industry %>% select(NAICS, Industry, Count), "out/victim-industry.csv", row.names=FALSE)

# make the JSON for the victim count by industry

writeLines(paste('[
  {
    "key": "Series2",
    "color": "#1f77b4",
    "values": ', toJSON(victim_industry %>% select(Count, Description), pretty=TRUE), "
  } 
]"), "out/victim-industry.json")

# make the CSV for the victim count by country

victim_country <- getenum(vcdb, "victim.country") %>%
  select(Country=enum, Count=x) %>%
  mutate(Name=countrycode(as.character(Country), "iso2c", "country.name"),
         Name=ifelse(is.na(Name), "Unknown", Name),
         Name=toupper(Name)) %>%
  arrange(desc(Count))
write.csv(victim_country, "out/victim-country.csv", row.names=FALSE)

# make the Victims by Country and industry CSV

victim_ci <- getenum(vcdb, "victim.country", "victim.industry2")
tmp <- victim_ci %>% 
  select(Country=enum, code=enum1, Count=x) %>%
  filter(code %in% valid_naics) %>%
  mutate(code=ifelse(code %in% c("31", "32", "33"), "31", code),
         code=ifelse(code %in% c("44", "45"), "44", code),
         code=ifelse(code %in% c("48", "49"), "48", code),
         code=ifelse(code %in% c("00", "99"), "00", code)) %>%
  mutate(Country=as.character(Country)) %>%
  group_by(code, Country) %>%
  dplyr::count(code, Country, wt=Count) %>%
  merge(industry2, all.x=TRUE) %>%
  mutate(CountryName=countrycode(as.character(Country), "iso2c", "country.name"),
         CountryName=toupper(CountryName)) %>%
  select(NAICS=code, CountryCode=Country, IncidentCount=n, 
         IndustryName=short, CountryName=CountryName)
write.csv(tmp, "out/victims.csv", row.names=FALSE, quote=c(4,5))



base <- getenum(vcdb, c("pattern", "victim.industry2")) %>% 
  select(Pattern=enum, code=enum1, Count=x, Total=n, Percent=freq) %>%
  merge(industry2, all.x=TRUE, by="code") %>%
  group_by(short) %>%
  mutate(ind_tot=sum(Count), 
         ind_pct=Count/ind_tot, 
         z=ind_pct, 
         label=paste0(round(ind_pct*100, 0), "%")) %>% ungroup %>%
  select(ind=short, tot=ind_tot, pat=Pattern, cnt=Count, pct=ind_pct, lab=label, z=z) %>%
  arrange(ind) %>%
  mutate(x=as.numeric(factor(as.character(ind), 
                             levels=unique(as.character(ind)), 
                             ordered=TRUE, 
                             labels=1:length(unique(as.character(ind)))))) %>%
  arrange(pat) %>%
  mutate(y=as.numeric(factor(as.character(pat), 
                             levels=unique(as.character(pat)), 
                             ordered=TRUE, 
                             labels=1:length(unique(as.character(pat)))))) %>%
  mutate(lab=ifelse(lab=="0%", "<1%", lab))

for_vis <- list(zrange=range(base$z),
                cols=unique(as.character(base$ind)),
                rows=unique(as.character(base$pat)),
                data=base)

writeLines(toJSON(for_vis, dataframe="rows", pretty=TRUE), "out/vcdb19.json")


confirmed <- vcdb %>% filter(attribute.confidentiality.data_disclosure.Yes==TRUE)
breach <- getenum(confirmed, c("pattern", "victim.industry2")) %>% 
  select(Pattern=enum, code=enum1, Count=x, Total=n, Percent=freq) %>%
  merge(industry2, all.x=TRUE, by="code") %>%
  group_by(short) %>%
  mutate(ind_tot=sum(Count), 
         ind_pct=ifelse(is.nan(Count/ind_tot), 0.0, Count/ind_tot), 
         z=ind_pct, 
         label=paste0(round(ind_pct*100, 0), "%")) %>% ungroup %>%
  select(ind=short, tot=ind_tot, pat=Pattern, cnt=Count, pct=ind_pct, lab=label, z=z) %>%
  arrange(ind) %>%
  mutate(x=as.numeric(factor(as.character(ind), 
                             levels=unique(as.character(ind)), 
                             ordered=TRUE, 
                             labels=1:length(unique(as.character(ind)))))) %>%
  arrange(pat) %>%
  mutate(y=as.numeric(factor(as.character(pat), 
                             levels=unique(as.character(pat)), 
                             ordered=TRUE, 
                             labels=1:length(unique(as.character(pat)))))) %>%
  mutate(lab=ifelse(lab=="0%", "<1%", lab))

for_vis <- list(zrange=range(breach$z),
                cols=unique(as.character(breach$ind)),
                rows=unique(as.character(breach$pat)),
                data=breach)

writeLines(toJSON(for_vis, dataframe="rows", pretty=TRUE), "out/vcdb19-breach.json")


# # this is the bar chart data for the summary tab

actor <- getenum(vcdb, "actor", add.freq = TRUE)
action <- getenum(vcdb, "action", add.freq = TRUE)
asset <- getenum(vcdb, "asset.assets", add.freq = TRUE)
attribute <- getenum(vcdb, "attribute", add.freq = TRUE)

by_year <- getenum(vcdb, "timeline.incident.year")
by_year$enum <- as.numeric(as.character(by_year$enum))
by_year <- by_year[by_year$enum >= 2000,]
by_year <- by_year[order(by_year$enum),]
setnames(by_year, c("x", "y", "n", "freq"))

setnames(actor,c("key", "value", "n", "freq"))
setnames(action,c("key", "value", "n", "freq"))
setnames(asset,c("key", "value", "n", "freq"))
setnames(attribute,c("key", "value", "n", "freq"))

actor$series <- 0
action$series <- 0
asset$series <- 0
attribute$series <- 0

for_vis <- list(actor=list(key="actor", color="#993404", values=actor),
                action=list(key="action", color="#993404", values=action),
                asset=list(key="asset", color="#993404", values=asset),
                attribute=list(key="attribute", color="#993404", values=attribute),
                byYear=list(key="byYear", color="#993404", values=by_year))

writeLines(toJSON(for_vis, dataframe="rows", factor="string", 
                  complex="string", auto_unbox=TRUE, pretty=TRUE), "out/a4.json")



