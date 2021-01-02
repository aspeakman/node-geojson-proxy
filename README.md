# node-geojson-proxy

A configurable [node.js](https://nodejs.org/api/) proxy to provide [GeoJSON](https://geojson.org/) output from an online JSON target such as [PostgREST](https://postgrest.org/) 

1. Sets CORS headers based on the allowed verbs
2. Reformats the JSON data output as a GeoJSON collection based on the request Accept header
3. Re-formats the OpenAPI output to remove inapplicable verbs

# Install

npm install
node index.js

Create a config/local_default.yaml to override or adapt any of the settings you find in config/default.yaml

At a minimum you will need to define your own 'port' and 'target'

Note the geoJSON processing is based on finding named fields with expected geometric contents. The expected contents are define in 'geoFields'

Example:
{ 'point_pair': 'lng', 'lat' }  # derives a GeoJSON point from two fields on
{ 'geojson': 'point', 'types: # expects a eg PostGIS geometry field

If expected fields are absent (eg they have been aliased or not selected for output) - the result will still be in GeoJSON format, but the 'coordinates' will be null
