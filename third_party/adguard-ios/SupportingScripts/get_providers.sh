#!/bin/sh

git clone https://bit.int.agrd.dev/scm/adguard-filters/dns-resolvers.git

cp dns-resolvers/output/providers.json ../AdGuardSDK/AdGuardSDK/DNS/DnsProviders/Predefined/providers.json
cp dns-resolvers/output/providers_i18n.json ../AdGuardSDK/AdGuardSDK/DNS/DnsProviders/Predefined/providers_i18n.json

rm -rf dns-resolvers
