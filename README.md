# node-geojson-proxy

A configurable [node.js](https://nodejs.org/api/) proxy to provide read-only [GeoJSON](https://geojson.org/) output from an online JSON target such as [PostgREST](https://postgrest.org/) 

1. Sets CORS headers with allowed read-only methods and origins
2. If required, reformats JSON responses from the target as a GeoJSON FeatureCollection or single Feature
3. Re-formats any OpenAPI output to remove inapplicable write methods

# Configuration

Create a `config/local_default.yaml` or `config/local_default.json` to override or adapt any of the settings you find in `config/default.yaml`

At a minimum you will need to define your own 'port' and 'target'

## Geometric fields

The GeoJSON processing is based on creating Features from named fields with expected geometric contents. The expected contents are define in 'geoFields'. The default configuration includes the following:

Derive a Feature containing a GeoJSON Point created from two fields named 'lng' and 'lat'
> { "point_pair": [ "lng", "lat" ] }

Derive a Feature from a field already containing valid GeoJSON eg a PostGIS geometry field (in this case a Point taken from a field named 'location')
> { "geojson": "location", "types": [ "Point" ] }

Derive a Feature from a field containing coordinate array(s) of lng, lat data (in this case a Polygon is created using coordinates in a field named 'bounds')
> { "coordinates": "bounds", "type": "Polygon" }

## 'Accept' headers

In the default configuration, the GeoJSON transformation works only if the request has a particular 'Accept' header, with all other output passed through. This means that you can use the proxy to provide source JSON and transformed GeoJSON from the same source.

The expected Accept headers are defined in 'geoCollectionAccept', by default as follows:

> geoCollectionAccept = [ 'application/geo+json',  'vnd/geo+json' ]

Alternatively if you set 'geoCollectionAccept' to null in `config/local_default`, the 'Accept' header will be ignored and all JSON output will be transformed to GeoJSON.

# Operation

> npm install

> node index.js
