// Function library
const config = require('config');

function enableCors (req, res) {
        /*if (req.headers['access-control-request-method']) {
                res.setHeader('access-control-allow-methods', req.headers['access-control-request-method']);
        }
        if (req.headers['access-control-request-headers']) {
                res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']);
        }
        if (req.headers.origin) {
            res.setHeader('access-control-allow-origin', req.headers.origin);
            res.setHeader('access-control-allow-credentials', 'true');
        }*/
        res.setHeader('Access-Control-Allow-Origin', '*');
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
