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
    secure: config.ssl-secure, 
    changeOrigin: config.changeOrigin
}
if (config.has('ssl-cert') && config.has('ssl-key')) {
    const fs = require("fs")
    try {
        options.ssl = {
            key: fs.readFileSync(config.get('ssl-key'), 'utf8'),
            cert: fs.readFileSync(config.get('ssl-cert'), 'utf8')
        }
    } catch (err) {
        // do nothing
    }
}

// Create a proxy server using the options
var proxy = httpProxy.createProxyServer(options);

var sendError = function(res, err) {
    return res.status(500).send({
         error: err,
         message: "An error occured in the GeoJSON proxy"
    });
};

// error handling
proxy.on("error", function (err, req, res) {
    sendError(res, err);
});

// Listen for the `proxyRes` event on `proxy`.
//
proxy.on("proxyRes", function(proxyRes, req, res) {
    lib.enableCors(req, res);
    modifyResponse(res, proxyRes, lib.jsonToGeoJSON(body));
});

// Start proxying
if (options.ssl != null) {
    console.log("Starting GeoJSON proxy on port", config.port, "for", config.target);
} else {
    console.log("Starting secure GeoJSON proxy on port", config.port, "for", config.target);
}

// Create your server and then proxies the request
var server = http.createServer(function (req, res) {

    if (req.method === 'OPTIONS') {
        lib.enableCors(req, res);
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



