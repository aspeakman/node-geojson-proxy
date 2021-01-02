// Function library
process.env.NODE_ENV = "local_default"; // uses any settings in "local_default" to override "default"
const config = require('config');

function corsHeaders (req, res) {
    if (!config.has('corsAllow') || !req.headers['origin']) return; // no CORS processing
    const corsAllow = config.get('corsAllow') || '*';
    res.setHeader('access-control-allow-credentials', 'false');
    if (req.headers['access-control-request-method']) {
        res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS'); // only allow read access
    }
    if (req.headers['access-control-request-headers']) {
        res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']); // agree to any request header
    }
    if (Array.isArray(corsAllow))  {
        for (const origin_match of corsAllow) {
            if (req.headers['origin'].match(origin_match)) { // does the pattern match this origin
                res.setHeader('access-control-allow-origin', req.headers['origin']);
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
            delete row[gf.geojson]; // redundant, so removed from properties
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
    var newbody = null;
    if (!body || !config.has('geoFields')) return newbody; // empty collection if there are no geo related results
    const geoFields = config.get('geoFields');
    var feature;
    if (Array.isArray(body)) { // rows of data
        newbody = { type: "FeatureCollection", features: [] }; // always returns a collection
        for (var row of body) {
            feature = { type: "Feature" };
            feature.geometry = _extractRowGeometry(row, geoFields); // note can alter the row, also result can be null
            feature.properties = row;
            newbody.features.push(feature); // always add a feature even if geometry is null = no location
       }
    } else {
        feature = { type: "Feature" };
        feature.geometry = _extractRowGeometry(body, geoFields); // note can alter the body, also result can be null
        feature.properties = body;
        //newbody.features.push(feature); // always add a feature even if geometry is null = no location
        newbody = feature;
    }
    return newbody; 
}

function openAPIJSON (body) {
    const read_methods = [ 'get', 'post', 'options' ];
    for (var p in body.paths) { // path keys
        for (var m in body.paths[p]) { // method keys
            if (read_methods.indexOf(m) < 0) {
                delete body.paths[p][m];
            }
        }
    }
    return body; 
}

// export library functions
module.exports = { jsonToGeoJSON, corsHeaders, openAPIJSON };
