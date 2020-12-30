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

function jsonToGeoJSON (body) {
    if (body && Array.isArray(body)) {
       var count = 0;
       var newbody = { type: "FeatureCollection", features: [] };
       for (var row of body) {
           var feature = { type: "Feature" };
           for (const gf of geo_fields) {
               if (row[gf.name] != null && gf.types.indexOf(row[gf.name].type) > -1) {
                   feature.geometry = row[gf.name];
                   delete row[gf.name]; // redundant in properties
                   break;
               }
           }
           if (feature.geometry == null) {
              for (const lf of lnglat_fields) {
                 if (row[lf[0]] != null && row[lf[1]] != null) {
                   feature.geometry = { type: 'Point', coordinates:
                           [ row[lf[0]], row[lf[1]] ] }; // new GeoJson entry
                   break;
                 }
              }
           }
           if (feature.geometry != null) {
               feature.properties = row;
               newbody.features.push(feature);
               count += 1;
           }
       }
       if (count > 0) body = newbody;
    }
    return body; // return value can be a promise
}

// export library functions
module.exports = { jsonToGeoJSON, enableCors };
