/**
 * This will create a GEOJSON proxy which deals with CORS issues.
 * Settings are on the config directory by default
 */

var http = require("http")
var httpProxy = require("http-proxy");
var modifyResponse = require('node-http-proxy-json');
const config = require('config');

// Define the fields that will be scanned for specific types of GeoJSON entities
const geo_fields = [
    { name: "location", types: [ "Point" ] },
    { name: "borders", types: [ "Polygon", "MultiPolygon" ] }
]
// Define the fields that will be scanned for pairs of lng, lat entries
const lnglat_fields = [
    [ 'lng', 'lat' ],
    [ 'longitude', 'latitude' ]
]
// Define the CORS allowed origins, methods
const cors_allowed = [
    [ /^https?:\/\/geojson\.io/, /(GET|POST|OPTIONS)/ ]
]

// Start the proxy
console.log("Starting proxy on port", config.port, "for", config.target);

// Create a proxy server with custom application logic
const fs = require('fs');
var proxy = httpProxy.createProxyServer({
    //secure: true, // Depends on your needs, could be false.`
    /*ssl: {
      key: fs.readFileSync('/etc/letsencrypt/live/dev.planit.org.uk/privkey.pem', 'utf8'),
      cert: fs.readFileSync('/etc/letsencrypt/live/dev.planit.org.uk/cert.pem', 'utf8')
       }*/
});

var sendError = function(res, err) {
    return res.status(500).send({
         error: err,
         message: "An error occured in the proxy"
    });
};

// error handling
proxy.on("error", function (err, req, res) {
        sendError(res, err);
});

var enableCors = function(req, res) {
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
         res.setHeader('access-control-allow-origin', '*');
};

// Listen for the `proxyRes` event on `proxy`.
//
proxy.on("proxyRes", function(proxyRes, req, res) {
    enableCors(req, res);
    modifyResponse(res, proxyRes, function (body) {
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
    });
});

// Create your server and then proxies the request
var server = http.createServer(function (req, res) {

    if (req.method === 'OPTIONS') {
        enableCors(req, res);
        res.writeHead(200);
        res.end();
        return;
    }

    proxy.web(req, res, {
        target: options.target,
        //secure: true,
        changeOrigin: true
    }, function(err) {
        sendError(res, err);
    });

}).listen(config.port);



