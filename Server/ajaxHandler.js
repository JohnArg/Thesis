/*
This module will handle Ajax POST requests. It will
read the algorithm code and run the appropriate algorithm
on the network object passed in the request.
The response will be an object that contains the 
fields:
code : the type of data the algorithm returns so that 
	   the client knows how to handle the representation
	   1: wu li dominators list, 2: multipoint relays cds 
	   3: dca, 4: max_min, 5: mis, 6: lmst, 7: rng, 8: gg
solution : the data to be sent to the client 
*/
var WuLiModule = require("./Algorithms/wu_li_cds");
var MPR_Module = require("./Algorithms/mpr_set");
var DCA_Module = require("./Algorithms/dca_clusters");
var MaxMinModule = require("./Algorithms/max_min_clusters");
var LMST_Module = require("./Algorithms/lmst");
var RNG_Module = require("./Algorithms/rng");

var ajaxRoute = function(code, net, extras, response){
	switch(code){
		case 'alg_1': handler["wu_li"](net,response);break;
		case 'alg_2': handler["mpr"](net,response);break;
		case 'alg_3': handler["dca"](net,extras,response);break;
		case 'alg_4': handler["max_min"](net,extras,response);break;
		case 'alg_5': handler["mis"](net,response);break;
		case 'alg_6': handler["lmst"](net,response);break;
		case 'alg_7': handler["rng"](net,response);break;
		case 'alg_8': handler["gg"](net,response);break;
		default: handler["default"](response);break;
	}
}

var handler = {
	"wu_li" : function(net,response){
		var WuLi = WuLiModule.WuLiFactory();
		var wu_li_solution = WuLi.calculateWuLi(net);
		var responseData = {"code" : "1", "solution" : wu_li_solution}; 
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"mpr" : function(net, response){
		var MPR_cds = MPR_Module.MPR_Factory();
		var mpr_solution = MPR_cds.calculate_MPR_CDS(net);
		var responseData = {"code" : "2", "solution" : mpr_solution}; 
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"dca" : function(net, extras, response){
		var dcaClusters = DCA_Module.dcaFactory();
		var dca_solution = dcaClusters.calculate_DCA_Clusters(net, extras);
		var responseData = {"code" : "3", "solution" : dca_solution}; 
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"max_min" : function(net, extras, response){
		var MaxMinClusters = MaxMinModule.newMaxMinObject();
		var MaxMinSolution = MaxMinClusters.calculateMaxMixClusters(net, extras["d"]);
		var responseData = {"code" : "4", "solution" : MaxMinSolution};
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"mis" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write("");
		response.end();
	},
	"lmst" : function(net, response){
		var lmst = LMST_Module.newLMST();
		var lmstSolution = lmst.constructLMST(net);
		var responseData = {"code" : "6", "solution" : lmstSolution};
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"rng" : function(net, response){
		var rng = RNG_Module.newRNG();
		var rngSolution = rng.constructRNG(net);
		var responseData = {"code" : "7", "solution" : rngSolution};
		responseData = JSON.stringify(responseData);
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write(responseData);
		response.end();
	},
	"gg" : function(net, response){
		response.writeHead(200, "OK", {"Content-Type" : "application/json"});
		response.write("");
		response.end();
	},
	"default" : function(response){
		response.writeHead(200, "OK", {"Content-Type" : "text/plain"});
		response.write("");
		response.end();
	}
}

module.exports.ajaxRoute = ajaxRoute;