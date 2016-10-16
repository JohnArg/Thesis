/*
This module will handle Ajax POST requests. It will
read the algorithm code and run the appropriate algorithm
on the network object passed in the request.
The response will be an object that contains the 
fields:
data-type : the type of data the algorithm returns sto that 
			the client knows how to handle it
data-content : the data to be sent to the client 
*/
var WuLi = require("./Algorithms/wu_li_cds").WuLi;

var ajaxRoute = function(code, net, response){
	switch(code){
		case 'alg_1': handler["wu_li"](net,response);break;
		case 'alg_2': handler["mpr"](net,response);break;
		case 'alg_3': handler["dca"](net,response);break;
		case 'alg_4': handler["max_min"](net,response);break;
		case 'alg_5': handler["mis"](net,response);break;
		case 'alg_6': handler["lmst"](net,response);break;
		case 'alg_7': handler["rng"](net,response);break;
		case 'alg_8': handler["gg"](net,response);break;
		default: handler["error"](net,response);break;
	}
}

var handler = {
	"wu_li" : function(net,response){
		var dominatorList = WuLi.calculateWuLi(net);
		var responseData = {
			"data-type" : "dominator-list",
			"data-content" : dominatorList
		};
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"mpr" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({});
		response.end();
	},
	"dca" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({});
		response.end();
	},
	"max_min" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({});
		response.end();
	},
	"mis" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({});
		response.end();
	},
	"lmst" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({});
		response.end();
	},
	"rng" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({});
		response.end();
	},
	"gg" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({});
		response.end();
	}
}

module.exports.ajaxRoute = ajaxRoute;