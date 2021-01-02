/**
 * This will create a proxy that massages a target JSON response into GEOJSON format.
 * Settings are in the config directory by default
 */

var http = require("http")
var httpProxy = require("http-proxy");
var modifyResponse = require("node-http-proxy-json");
var lib = require("./lib")

process.env.NODE_ENV = "local_default"; // uses any settings in "local_default" to override "default"
const config = require('config');

// get proxy options from config
var options = {
    target: config.target,
    changeOrigin: config.changeOrigin
}

// Create a proxy server using the options
var proxy = httpProxy.createProxyServer(options);

var sendError = function(res, err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' } );
    res.end('An error occured in the GeoJSON proxy');
};

// error handling
proxy.on("error", function (err, req, res) {
    sendError(res, err);
});

// Listen for the `proxyRes` event on `proxy`.
//
proxy.on("proxyReq", function(proxyReq, req, res) {
    var accept_header = req.headers['accept'] || ''; // the requested content type
    console.log('req1', proxyReq.headers);
    console.log('req2', req.headers);
    if (accept_header.match(config.geoAccept)) {
	    proxyReq.headers['accept'] = 'application/json'; // make actual request acceptable to the target
    }
    console.log('req3', proxyReq.headers);
    console.log('req4', req.headers);
});

// Listen for the `proxyRes` event on `proxy`.
//
proxy.on("proxyRes", function(proxyRes, req, res) {
	console.log('resq', req.headers);
    var accept_header = req.headers['accept'] || ''; // the requested content type
    lib.corsHeaders(req, res);
    modifyResponse(res, proxyRes, function (body) {
        var ct_header = proxyRes.headers['content-type'] || '';
        if (ct_header.indexOf('application/json') == 0 && accept_header.match(config.geoAccept)) { 
            return lib.jsonToGeoJSON(body); // massage the reponse only if it is proper JSON and geoJSON was requested
        } else if (ct_header.indexOf('application/openapi+json') == 0) {
            return lib.openAPIJSON(body); // remove inapplicable verbs from OpenAPI JSON
        } else { 
            return body; // otherwise return as is
        }
       });
});


// Create  server which proxies the request
var server = http.createServer(function (req, res) {

    if (req.method === 'OPTIONS') {
        lib.corsHeaders(req, res);
        res.writeHead(200, { 'Allow': 'GET, POST, OPTIONS' } );
        res.end();
        return;
    }
	
    proxy.web(req, res);

});

// Start proxying
console.log("Starting GeoJSON proxy on port", config.port, "for", config.target);
server.listen(config.port);
