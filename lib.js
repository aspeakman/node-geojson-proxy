// Function library

// optionally use WKT module
try {                                                                                                                                                                                                                     
    var wkt = require("wkt");
} catch (e) {  
    var wkt = null;
}

// Config settings
process.env.NODE_ENV = "local_default"; // uses any settings in "local_default" to override "default"
const config = require('config');
var corsAllow = null;
if (config.has('corsAllow')) {
    corsAllow = config.get('corsAllow') || '*';
    if (Array.isArray(corsAllow)) {
        for (var ca of corsAllow) {
            ca = new RegExp(ca);
        }
    }
}
var geoFields = null;
if (config.has('geoFields')) {
    geoFields = config.get('geoFields');
}

function corsHeaders (req, res) {
    //if (!corsAllow || !req.headers['origin']) return; // no CORS processing
    if (!corsAllow) return;
    res.setHeader('access-control-allow-credentials', 'false');
    if (req.headers['access-control-request-method']) {
        res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS, HEAD'); // only allow read access
    }
    if (req.headers['access-control-request-headers']) {
        res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']); // agree to any request header
        // or "Origin,Authorization,X-Requested-With,Content-Type,Accept"
    }
    if (Array.isArray(corsAllow))  {
        if (!req.headers['origin']) return;
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
        if (gf.geojson != null && gf.types != null && row[gf.geojson] != null) {
            if (gf.types.indexOf(row[gf.geojson].type) > -1) { // do the contents match an acceptable type?
                var geometry = row[gf.geojson];
                delete row[gf.geojson]; // redundant, so removed from properties
                return geometry;
            }
        } else if (gf.point_pair != null && row[gf.point_pair[0]] != null && row[gf.point_pair[1]] != null) {
            return { type: 'Point', coordinates:
                       [ row[gf.point_pair[0]], row[gf.point_pair[1]] ] }; // new GeoJson Point entry
            break;
        } else if (gf.coordinates != null && gf.type != null && row[gf.coordinates] != null) {
            return { type: gf.type, coordinates: row[gf.coordinates] }; // new GeoJson entry
        } else if (wkt != null && gf.wkt != null && gf.types != null && row[gf.wkt] != null) {
            var geoj = wkt.parse(row[gf.wkt]);
            if (geoj && gf.types.indexOf(geoj.type) > -1) { // do the contents match an acceptable type?
                return geoj;
            }
        } 
    }
    return null;
}

function jsonToGeoJSON (body) {
    if (!geoFields) return body; // return data as is if no geo related results are specified
    var feature; var newbody;
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
    const read_methods = [ 'get', 'post' ];
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
