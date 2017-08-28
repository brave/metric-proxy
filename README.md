# metric-proxy

anonymizing mixpanel gateway

## features

- Supports Mixpanel HTTP API /track endpoint, via GET (single) and POST (batch events)
- Persist campaign params as cookies (e.g. for funnel tracking)
- Hides user IP addresses from Mixpanel

## usage

1. `npm install`
2. Set env vars:
```
MIXPANEL_API_HOST="https://api.mixpanel.com"
MIXPANEL_TOKEN_WHITELIST="{token1},{token2},..."
```
3. `npm start`
4. Set Mixpanel API endpoint to http://localhost:4000 and send some data.
