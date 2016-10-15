var GETHandler = require("./requestHandler");
//route requests to repsective handlers
var Router = function(){
	this.routeGETRequest = function (pathname, response){
		switch(pathname){
			case "":
			case "/": GETHandler.handle["workspace"](response); break;
			default: GETHandler.handle["404"](response); break;
		}
	}
}
module.exports.router = new Router();