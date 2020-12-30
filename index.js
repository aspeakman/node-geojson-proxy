/**
 * This will create a GEOJSON proxy which deals with CORS issues.
 * Settings are in the config directory by default
 */

var http = require("http")
var httpProxy = require("http-proxy");
var modifyResponse = require("node-http-proxy-json");
var lib = require("./lib")

process.env.NODE_ENV = "local_default"; // use local settings as default
const config = require('config');

// get proxy options from config
var options = {
    target: config.target,
    changeOrigin: config.changeOrigin
}
if (config.has('ssl_cert_file') && config.has('ssl_key_file')) {
    const fs = require("fs")
    try {
        options.ssl = {
            key: fs.readFileSync(config.get('ssl_key_file'), 'utf8'),
            cert: fs.readFileSync(config.get('ssl_cert_file'), 'utf8')
        };
        if (config.has('ssl_secure')) options.secure = config.get('ssl_secure');
    } catch (err) {
        options.ssl = null;
    }
}

if (config.has('debug')) console.log (options);

// Create a proxy server using the options
var proxy = httpProxy.createProxyServer(options);

var sendError = function(res, err) {
    /*return res.status(500).send({
         error: err,
         message: "An error occured in the GeoJSON proxy"
    });*/
    res.writeHead(500, { 'Content-Type': 'text/plain' } );
    res.end('An error occured in the GeoJSON proxy');
};

// error handling
proxy.on("error", function (err, req, res) {
    sendError(res, err);
});

// Listen for the `proxyRes` event on `proxy`.
//
proxy.on("proxyRes", function(proxyRes, req, res) {
    lib.enableCors(req, res);
    modifyResponse(res, proxyRes, function (body) {
	    return lib.jsonToGeoJSON(body);
       });
});

// Start proxying
if (options.ssl != null) {
    console.log("Starting secure GeoJSON proxy on port", config.port, "for", config.target);
} else {
    console.log("Starting GeoJSON proxy on port", config.port, "for", config.target);
}

// Create your server and then proxies the request
var server = http.createServer(function (req, res) {

    if (req.method === 'OPTIONS') {
        lib.enableCors(req, res);
        res.writeHead(200);
        res.end();
        return;
    }

    proxy.web(req, res);

}).listen(config.port);



