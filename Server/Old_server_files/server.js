/*
Server module. It returns a new server instance. 
Used to open a Web Server and pass any HTTP request
to a router object for appropriate handling.
*/
var http = require("http");
var url = require("url");
var router = require("./router").router;	//this will route the requests to appropriate handler
var ajax = require("./ajaxHandler");

//returns a server object
function serverFactory(){
	var WebServer = function(){
		this.onRequest = function(request, response){
			switch(request.method){
				case "GET" :
					var pathname = url.parse(request.url).pathname;
					router.routeGETRequest(pathname, response);
					break;
				case "POST" :
					var body = '';
					var ajaxObject;
				    request.on('data', function(chunk){
				        body += chunk;
				    });
					request.on('end', function(){
						ajaxObject = JSON.parse(body); 
						ajax.ajaxRoute(ajaxObject.code, ajaxObject.net, ajaxObject.extras, response);
					});
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