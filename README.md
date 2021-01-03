# node-geojson-proxy

A configurable [node.js](https://nodejs.org/api/) proxy to provide read-only [GeoJSON](https://geojson.org/) output from an online JSON target such as [PostgREST](https://postgrest.org/) 

1. Sets CORS headers with allowed methods and origins
2. Reformats the JSON data output as a GeoJSON FeatureCollection or single Feature
3. Re-formats any OpenAPI output to remove inapplicable write methods

# Configuration

Create a `config/local_default.yaml` to override or adapt any of the settings you find in `config/default.yaml`

At a minimum you will need to define your own 'port' and 'target'

Note the geoJSON processing is based on finding named fields with expected geometric contents. The expected contents are define in 'geoFields'. Examples are as follows:

> { "point_pair": \\\[ "lng", "lat" \\\] }  # derives a GeoJSON Point from two fields named 'lng' and 'lat'

> { "geojson": "location", "types": \\\[ "Point" \\\] } # expects a 'location' field already containing valid GeoJSON eg a PostGIS geometry field (in this case a lng, lat point)

> { "coordinates": "polygon", "type": "Polygon" } # expects a 'bounds' field containing the array(s) of lng, lat points for a polygon GeoJSON geometry

