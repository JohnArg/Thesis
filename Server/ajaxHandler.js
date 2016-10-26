/*
This module will handle Ajax POST requests. It will
read the algorithm code and run the appropriate algorithm
on the network object passed in the request.
The response will be an object that contains the 
fields:
code : the type of data the algorithm returns so that 
	   the client knows how to handle the representation
	   1: dominators list
	   2: clusters list
	   3: max-min special view
	   4: topology data
solution : the data to be sent to the client 
*/
var WuLi = require("./Algorithms/wu_li_cds").WuLi;
var MPR_cds = require("./Algorithms/mpr_set").MPR_cds;

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
		default: handler["default"](response);break;
	}
}

var handler = {
	"wu_li" : function(net,response){
		var wu_li_solution = WuLi.calculateWuLi(net);
		responseData = {"code" : "1", "solution" : wu_li_solution}; 
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"mpr" : function(net, response){
		var mpr_solution = MPR_cds.calculateWuLi(net);
		responseData = {"code" : "1", "solution" : mpr_solution}; 
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
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
	},
	"default" : function(response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write({"code" : "0"});
		response.end();
	}
}

module.exports.ajaxRoute = ajaxRoute;