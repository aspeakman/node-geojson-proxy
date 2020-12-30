// Function library
process.env.NODE_ENV = "local_default"; // use local settings as default
const config = require('config');

function enableCors (req, res) {
    if (!config.has('corsAllow')) return;
    const corsAllow = config.get('corsAllow');
    if (req.headers['access-control-request-method']) {
        res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS'); // allow read only access
    }
    if (req.headers['access-control-request-headers']) {
        res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']); // agree to any request header
    }
    res.setHeader('access-control-allow-credentials', 'false');
    if (req.headers.origin && Array.isArray(corsAllow))  {
        for (const origin_match of corsAllow) {
            if (req.headers.origin.match(origin_match)) { // does the pattern match this origin
                res.setHeader('access-control-allow-origin', req.headers.origin);
                res.setHeader('vary', 'Origin');
                break;
            }
        }
    } else {
        res.setHeader('access-control-allow-origin', corsAllow);
    }
};

function _extractRowGeometry (row, geoFields) {
    for (const gf of geoFields) {
        if (gf.geojson != null && gf.types != null && row[gf.geojson] != null && gf.types.indexOf(row[gf.geojson].type) > -1) {
            var geometry = row[gf.geojson];
            delete row[gf.geojson]; // redundant in properties
            return geometry;
        } else if (gf.point_pair != null && row[gf.point_pair[0]] != null && row[gf.point_pair[1]] != null) {
            return { type: 'Point', coordinates:
                       [ row[gf.point_pair[0]], row[gf.point_pair[1]] ] }; // new GeoJson Point entry
            break;
        } else if (gf.coordinates != null && gf.type != null && row[gf.coordinates] != null) {
            return { type: gf.type, coordinates: row[gf.coordinates] }; // new GeoJson entry
        }
    }
    return null;
}

function jsonToGeoJSON (body) {
    if (!body || !config.has('geoFields')) return body;
    const geoFields = config.get('geoFields');
    if (config.has('debug')) console.log(geoFields);
    if (Array.isArray(body)) { // rows of data - translated either to a FeatureCollection (default) or a GeometryCollection
        var count = 0;
        var newbody = { type: "FeatureCollection", features: [] };
        for (var row of body) {
            var feature = { type: "Feature", geometry: _extractRowGeometry(row, geoFields) };
            if (feature.geometry != null) {
                feature.properties = row;
                newbody.features.push(feature);
                count += 1;
            }
       }
       if (count > 0) body = newbody;
    } else {
        var feature = { type: "Feature", geometry: _extractRowGeometry(body, geoFields) };
        if (feature.geometry != null) {
            feature.properties = body;
            body = feature;
        }
    }
    return body; // return value can be a promise
}

// export library functions
module.exports = { jsonToGeoJSON, enableCors };
