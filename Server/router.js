/*
To minimize code, server modules will send any GET requests they get to
a router module. This module will pass the real path of a requested object to the
appropriate request handler, depening on the type of the response. The Handler will 
create the final response. 
*/
var handlerMod = require("./requestHandler");

//route requests to repsective handlers
var Router = function(){
	this.routeGETRequest = function (pathname, response){
		//new instance of a handler
		var GETHandler = handlerMod.GETHandler;
		switch(pathname){
			case "":
			case "/": GETHandler.handle["workspace"](response); break;
			case "/jquery-ui.css" : GETHandler.handle["Css"](response, "./Client/Templates/Css/External/jquery-ui.css"); break;
			case "/workspace.css" : GETHandler.handle["Css"](response, "./Client/Templates/Css/workspaceV2.css"); break;
			case "/joint.css" : GETHandler.handle["Css"](response, "./Client/Templates/Css/External/joint.css"); break;
			case "/lodash.js" : GETHandler.handle["Js"](response, "./Client/Model/External/lodash.js"); break;
			case "/backbone.js": GETHandler.handle["Js"](response,"./Client/Model/External/backbone.js"); break;
			case "/joint.js": GETHandler.handle["Js"](response, "./Client/Model/External/joint_mod.js"); break;
			case "/networkManager.js": GETHandler.handle["Js"](response, "./Client/Model/networkManager.js"); break;
			case "/viewManager.js": GETHandler.handle["Js"](response, "./Client/Model/viewManager.js"); break;
			case "/resultView.js": GETHandler.handle["Js"](response, "./Client/Model/resultView.js"); break;
			default: GETHandler.handle["404"](response); break;
		}
	}
}

module.exports.router = new Router();