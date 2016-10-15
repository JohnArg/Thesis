var http = require("http");
var url = require("url");
var router = require("router");
//returns a server object
function serverFactory(portNum){
	var WebServer = function(port){
		this.port = port;
		this.onRequest = function(request, response){
			console.log("Request received");
			switch(request.method){
				case "GET" :
					var pathname = url.parse(request.url).pathname;
					router.routeGETRequest(pathname, response);
					break;
				default :
					response.writeHead(400,{"Content-Type" : "text/plain" });
					response.write("Bad request");
					response.end();
			}
		}
		this.startServer = function(port){
			http.createServer(onRequest).listen(port);
			console.log("Server started .."),
		}
	}
	return new WebServer(portNum);
}
//export a new server object each
module.exports.createServer = serverFactory;