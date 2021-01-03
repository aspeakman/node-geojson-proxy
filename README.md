# node-geojson-proxy

A configurable [node.js](https://nodejs.org/api/) proxy to provide read-only [GeoJSON](https://geojson.org/) output from an online JSON target such as [PostgREST](https://postgrest.org/) 

1. Sets CORS headers with allowed methods and origins
2. Reformats the JSON data output as a GeoJSON FeatureCollection or single Feature
3. Re-formats any OpenAPI output to remove inapplicable write methods

# Configuration

Create a `config/local_default.yaml` to override or adapt any of the settings you find in `config/default.yaml`

At a minimum you will need to define your own 'port' and 'target'

## Geometric fields

The geoJSON processing is based creating Features from named fields with expected geometric contents. The expected contents are define in 'geoFields'. Examples are as follows:

Derive a Feature with a GeoJSON Point created from two fields named 'lng' and 'lat'
> { "point_pair": [ "lng", "lat" ] }

Derive a Feature from a field already containing valid GeoJSON eg a PostGIS geometry field (in this case a Point taken from a field named 'location')
> { "geojson": "location", "types": [ "Point" ] }

Derive a Feature from a field containing coordinate array(s) of lng, lat data (in this case a Polygon is created from coordinates in a field named 'bounds')
> { "coordinates": "bounds", "type": "Polygon" }

## 'Accept' headers

You can set whether the proxy transforms any JSON response content or works only if the request has a particular 'Accept' header. The expected contents are defined in 'geoCollectionAccept', example as follows:

> geoCollectionAccept = [ 'application/geo+json',  'vnd/geo+json' ]

# Operation

> npm install
> node index.js
