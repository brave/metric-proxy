// In each tracking event, these are the properties which we retain and
// pass through to mixpanel. We filter out all other properties.

module.exports = [
  "distinct_id",
  "time",
  "token",
  "$app_version",
  "HTTPS Everywhere",
  "Tracking Protection Mode",
  "Ad Block",
  "Regional Ad Block",
  "Fingerprinting Protection",
  "JavaScript",
  "Block Ads and Tracking",
  "Block 3rd Party Cookies",
  "Block Scripts",
  "Top Shield"
]
