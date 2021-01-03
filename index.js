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
	target: config.get('target'),
	changeOrigin: config.get('changeOrigin') }

geoAccept = null; var geoSingleAccept = null;
if (config.has('geoSingleAccept') && config.get('geoSingleAccept')) {
const geoSingleAccept = new RegExp(config.geoAccept);

var sendError = function(res, err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' } );
    res.end('An error occured in the GeoJSON proxy');
};

var modifyGeo = function(res, proxyRes) { // modify GEOJSON and OpenAPI JSON
	modifyResponse(res, proxyRes, function (body) {
        var ct_header = proxyRes.headers['content-type'] || '';
        if (ct_header.indexOf('application/json') == 0 || ct_header.indexOf('application/vnd.pgrst.object+json') == 0) { 
            return lib.jsonToGeoJSON(body); // massage the response only if it is proper JSON
        } else if (ct_header.indexOf('application/openapi+json') == 0) {
            return lib.openAPIJSON(body); // remove inapplicable verbs from OpenAPI JSON
        } else { 
            return body; // otherwise return as is
        }
       });
};

var modifyNoGeo = function(res, proxyRes) { // just modify the OpenAPI JSON
	modifyResponse(res, proxyRes, function (body) {
        var ct_header = proxyRes.headers['content-type'] || '';
        if (ct_header.indexOf('application/openapi+json') == 0) {
            return lib.openAPIJSON(body); // remove inapplicable verbs from OpenAPI JSON
        } else { 
            return body; // otherwise return as is
        }
       });
};

// Create a proxy server using the options
var geoproxy = httpProxy.createProxyServer(options);
var nogeoproxy = httpProxy.createProxyServer(options);

// error handling
geoproxy.on("error", function (err, req, res) {
    sendError(res, err);
});
nogeoproxy.on("error", function (err, req, res) {
    sendError(res, err);
});

// Listen for the `proxyRes` event on `proxy`.
//
geoproxy.on("proxyRes", function(proxyRes, req, res) {
    lib.corsHeaders(req, res);
    modifyGeo(res, proxyRes);
});
nogeoproxy.on("proxyRes", function(proxyRes, req, res) {
    lib.corsHeaders(req, res);
    modifyNoGeo(res, proxyRes);
});

// Create  server which proxies the request
var server = http.createServer(function (req, res) {

    if (req.method === 'OPTIONS') {
        lib.corsHeaders(req, res);
        res.writeHead(200, { 'Allow': 'GET, POST, OPTIONS' } );
        res.end();
        return;
    }
	
    geoproxy.web(req, res);

});

// Start proxying
console.log("Starting GeoJSON proxy on port", config.get('port'), "for", config.get('target'));
server.listen(config.get('port'));
