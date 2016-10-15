/*
Server module. It returns a new server instance. 
Used to open a Web Server and pass any HTTP request
to a router object for appropriate handling.
*/
var http = require("http");
var url = require("url");
var router = require("./router").router;	//this will route the requests to appropriate handler
//returns a server object
function serverFactory(portNum){
	var WebServer = function(){
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
			http.createServer(this.onRequest).listen(port);
			console.log("Server started ..");
		}
	}
	return new WebServer();
}
module.exports.createServer = serverFactory;