/*
This module will get a file path from the router module and the type
of the expected response. It will then pass that file as a stream to
the response and send it.
*/
var fs = require("fs");

var GETHandler = function(){
	this.handle = {
		"workspace" : function(response){
			response.writeHead(200, "OK", { "Content-Type" : "text/html"});
			fs.createReadStream("./Client/Templates/workspaceV2.html").pipe(response);
		},
		"404" : function(response){
			response.writeHead(404, "Not Found", { "Content-Type" : "text/plain"});
			response.write("We're sorry. The page you requested cannot be found");
			response.end();
		},
		"Css" : function(response, path){
			response.writeHead(200, "OK", { "Content-Type" : "text/css"});
			fs.createReadStream(path).pipe(response);
		},
		"Js" : function(response, path){
			response.writeHead(200, "OK", { "Content-Type" : "application/javascript"});
			fs.createReadStream(path).pipe(response);
		}
	}
}	

module.exports.GETHandler = new GETHandler();