/*
This module handles ajax requests that have to do with the workspace
*/
var express = require('express');
var app = module.exports = express();
var ehbs = require('express-handlebars');
var bodyParser = require('body-parser');
var path = require('path');
var sharedData = require('../../shared_data').sharedData; //shared preferences
var session = require('../../Database/sessions').session;
var sessionConfig = require('../../Database/sessions').sessionConfig;
var sessionStore = require('../../Database/sessions').sessionStore;
//Algorithm imports
var WuLiModule = require("../Algorithms/wu_li_cds");
var MPR_Module = require("../Algorithms/mpr_set");
var DCA_Module = require("../Algorithms/dca_clusters");
var MaxMinModule = require("../Algorithms/max_min_clusters");
var LMST_Module = require("../Algorithms/lmst");
var RNG_Module = require("../Algorithms/rng");
var GG_Module = require("../Algorithms/gg");
var MIS_Module = require("../Algorithms/mis");

//set view engine
app.engine('hbs', ehbs({extname: 'hbs'}));
app.set('views', path.join(sharedData.rootDir, '/Client/Views'));
app.set('view-engine', 'hbs');
app.enable('view cache');

//Set up a router
var routerOptions = {
    caseSensitive : true,
    mergeParams : false,
    strict : false
}
var router = express.Router(routerOptions);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(session(sessionConfig));
app.use(router);//mount the router to the app

//Route the requests =======================================
router.get("/workspace", function(request, response){
	//check if session exists in the store
	sessionStore.get(request.session.id, (error, session)=>{
		if(error){ //error in session store
			reponse.status(500).send("Error when looking for session");
		}
		else{
			if(!session){ //no session exists
				response.status(200).render("loggedOut.hbs");
			}
			else{ //user logged in
				console.log("Workspace session exists", request.session);
				response.status(200).render("workspace.hbs", {first_name : request.session.first_name});
			}
		}
	});
});

router.get("/logOut", function(request, response){
	//check if session exists in the store
	sessionStore.get(request.session.id, (error, session)=>{
		if(error){ //error in session store
			reponse.status(500).send("Error when looking for session");
		}
		else{
			if(session){ //user logged in
				console.log(session);
				sessionStore.destroy(request.session.id, (error)=>{ //kill the session
					if(!error){
						request.session.destroy((error)=>{
							response.status(200).send("Logged Out");
						})
					}
					else{
						response.status(500).send("Failed to destroy session from store");
					}
				});
			}
			else{ //no session exists
				request.session.destroy(()=>{
					response.status(200).send("Already Out"); 
				});
			}
		}
	});
});

router.post("/algorithms", function(request, response){
	//check if session exists in the store
	sessionStore.get(request.session.id, (error, session)=>{
		if(error){ //error in session store
			reponse.status(500).send("Error when looking for session");
		}
		else{
			if(!session){
				response.status(400).send({message : "reloggin"}); //will force a /workspace redirect on client
			}
			else{
				var code = request.body.code;
				var net = request.body.net;
				var extras = request.body.extras;
				switch(code){
					case 'alg_1': handler["wu_li"](net,response);break;
					case 'alg_2': handler["mpr"](net,response);break;
					case 'alg_3': handler["dca"](net,extras,response);break;
					case 'alg_4': handler["max_min"](net,extras,response);break;
					case 'alg_5': handler["mis"](net,extras,response);break;
					case 'alg_6': handler["lmst"](net,response);break;
					case 'alg_7': handler["rng"](net,response);break;
					case 'alg_8': handler["gg"](net,response);break;
					default: handler["default"](response);break;
				}
			}
		}
	});
});

//Algorithm handler ============================================================
var handler = {
	"wu_li" : function(net,response){
		var WuLi = WuLiModule.WuLiFactory();
		var wu_li_solution = WuLi.calculateWuLi(net);
		var responseData = {"code" : "1", "solution" : wu_li_solution}; 
		response.status(200).send(responseData);
	},
	"mpr" : function(net, response){
		var MPR_cds = MPR_Module.MPR_Factory();
		var mpr_solution = MPR_cds.calculate_MPR_CDS(net);
		var responseData = {"code" : "2", "solution" : mpr_solution}; 
		response.status(200).send(responseData);
	},
	"dca" : function(net, extras, response){
		var dcaClusters = DCA_Module.dcaFactory();
		var dca_solution = dcaClusters.calculate_DCA_Clusters(net, extras);
		var responseData = {"code" : "3", "solution" : dca_solution}; 
		response.status(200).send(responseData);
	},
	"max_min" : function(net, extras, response){
		var MaxMinClusters = MaxMinModule.newMaxMinObject();
		var MaxMinSolution = MaxMinClusters.calculateMaxMixClusters(net, extras["d"]);
		var responseData = {"code" : "4", "solution" : MaxMinSolution};
		response.status(200).send(responseData);
	},
	"mis" : function(net, extras, response){
		var mis = MIS_Module.newMIS();
		var misSolution = mis.constructMIS(net, extras["root"]);
		var responseData = {"code" : "5", "solution" : misSolution};
		response.status(200).send(responseData);
	},
	"lmst" : function(net, response){
		var lmst = LMST_Module.newLMST();
		var lmstSolution = lmst.constructLMST(net);
		var responseData = {"code" : "6", "solution" : lmstSolution};
		response.status(200).send(responseData);
	},
	"rng" : function(net, response){
		var rng = RNG_Module.newRNG();
		var rngSolution = rng.constructRNG(net);
		var responseData = {"code" : "7", "solution" : rngSolution};
		response.status(200).send(responseData);
	},
	"gg" : function(net, response){
		var gg = GG_Module.newGG();
		var ggSolution = gg.constructGG(net);
		var responseData = {"code" : "8", "solution" : ggSolution};
		response.status(200).send(responseData);
	},
	"default" : function(response){
        response.status(200).send({});
	}
}
