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

// settings for procesing of request Accept headers
var geoCollectionAccept = null; var geoFeatureAccept = null;
if (config.has('geoCollectionAccept') && config.get('geoCollectionAccept')) {
    geoCollectionAccept = config.get('geoCollectionAccept');
    if (config.has('geoFeatureAccept') && config.get('geoFeatureAccept')) {
        geoFeatureAccept = config.get('geoFeatureAccept');
    }
}

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

// Create a geo proxy server using the options
var geoproxy = httpProxy.createProxyServer(options);
geoproxy.on("error", function (err, req, res) { // error handling
    sendError(res, err);
});
geoproxy.on("proxyRes", function(proxyRes, req, res) { // CORS and modify response
    lib.corsHeaders(req, res);
    modifyGeo(res, proxyRes);
});

var nogeoproxy = null; // if necessary also create a no geo proxy server using the options (used when the Accept header does not match)
if (geoCollectionAccept) {
    nogeoproxy = httpProxy.createProxyServer(options);
    nogeoproxy.on("error", function (err, req, res) {
        sendError(res, err);
    });
    nogeoproxy.on("proxyRes", function(proxyRes, req, res) {
        lib.corsHeaders(req, res);
        modifyNoGeo(res, proxyRes);
    });
}

// Create real server which proxies the request
var server = http.createServer(function (req, res) {

    if (req.method === 'OPTIONS') {
        lib.corsHeaders(req, res);
        res.writeHead(200, { 'Allow': 'GET, POST, OPTIONS, HEAD' } );
        res.end();
        return;
    } else if (req.method === 'GET' || req.method === 'POST' || req.method === 'HEAD') {
    	if (nogeoproxy) {
            var ac_header = req.headers['accept'] || '';
            if (ac_header && geoCollectionAccept.indexOf(ac_header) >= 0) { 
                req.headers['accept'] = 'application/json';
                geoproxy.web(req, res);
            } else if (ac_header && geoFeatureAccept && geoFeatureAccept.indexOf(ac_header) >= 0) {
                req.headers['accept'] = 'application/vnd.pgrst.object+json';
                geoproxy.web(req, res);
            } else {
                nogeoproxy.web(req, res); // do not massage into GeoJSON if the Accept headers dont match
            }
        } else {
            geoproxy.web(req, res); // default is to always massage into GeoJSON
        }
}

});

// Start proxying
console.log("Starting GeoJSON proxy on port", config.get('port'), "for", config.get('target'));
server.listen(config.get('port'));
