var fs = require("fs");
var GETHandlerFactory = function(response){
	var GETHandler = function(resp){
		this.handle = {
			"workspace" : function(resp){
				response.writeHead(200, "OK", { "Content-Type" : "text/html"}});
				fs.createReadStream("../Client/Templates/workspace.html").pipe(resp);
			},
			"404" : function(resp){
				response.writeHead(404, "Not Found", { "Content-Type" : "text/plain"}});
				response.write("We're sorry. The page you requested cannot be found");
				response.end();
		}
	}
	return new GETHandler(response);
}	
module.exports.GETHandler = GETHandlerFactory;