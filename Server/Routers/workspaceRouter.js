/*
This module handles requests that have to do with the workspace
*/
var express = require('express');
var app = module.exports = express();
var ehbs = require('express-handlebars');
var bodyParser = require('body-parser');
var path = require('path');
var appGlobalData = require('../../appGlobalData').appGlobalData; //shared preferences
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
app.set('views', path.join(appGlobalData.rootDir, '/Client/Views'));
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
	if(appGlobalData.env == "DESIGN"){
        response.status(200).render("workspace.hbs", {first_name : "Design Mode"});
    }
    else{
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
	}
});

router.get("/logOut", function(request, response){
	if(appGlobalData.env == "DESIGN"){
        response.status(200).render("loggedOut.hbs");
    }
    else{
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
	}
});

router.post("/algorithms", function(request, response){
	if(appGlobalData.env == "DESIGN"){
        handler["routeRequest"](request, response);
    }
    else{
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
					handler["routeRequest"](request, response);
				}
			}
		});
	}
});

//Algorithm handler ============================================================
var handler = {
	"routeRequest" : function(request,response){
		let code = request.body.code;
		let net = request.body.net;
		let extras = request.body.extras;
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
	},
	"wu_li" : function(net,response){
		let WuLi = WuLiModule.WuLiFactory();
		let wu_li_solution = WuLi.calculateWuLi(net);
		let responseData = {"code" : "1", "solution" : wu_li_solution}; 
		response.status(200).send(responseData);
	},
	"mpr" : function(net, response){
		let MPR_cds = MPR_Module.MPR_Factory();
		let mpr_solution = MPR_cds.calculate_MPR_CDS(net);
		let responseData = {"code" : "2", "solution" : mpr_solution}; 
		response.status(200).send(responseData);
	},
	"dca" : function(net, extras, response){
		let dcaClusters = DCA_Module.dcaFactory();
		let dca_solution = dcaClusters.calculate_DCA_Clusters(net, extras);
		let responseData = {"code" : "3", "solution" : dca_solution}; 
		response.status(200).send(responseData);
	},
	"max_min" : function(net, extras, response){
		let MaxMinClusters = MaxMinModule.newMaxMinObject();
		let MaxMinSolution = MaxMinClusters.calculateMaxMixClusters(net, extras["d"]);
		let responseData = {"code" : "4", "solution" : MaxMinSolution};
		response.status(200).send(responseData);
	},
	"mis" : function(net, extras, response){
		let mis = MIS_Module.newMIS();
		let misSolution = mis.constructMIS(net, extras["root"]);
		let responseData = {"code" : "5", "solution" : misSolution};
		response.status(200).send(responseData);
	},
	"lmst" : function(net, response){
		let lmst = LMST_Module.newLMST();
		let lmstSolution = lmst.constructLMST(net);
		let responseData = {"code" : "6", "solution" : lmstSolution};
		response.status(200).send(responseData);
	},
	"rng" : function(net, response){
		let rng = RNG_Module.newRNG();
		let rngSolution = rng.constructRNG(net);
		let responseData = {"code" : "7", "solution" : rngSolution};
		response.status(200).send(responseData);
	},
	"gg" : function(net, response){
		let gg = GG_Module.newGG();
		let ggSolution = gg.constructGG(net);
		let responseData = {"code" : "8", "solution" : ggSolution};
		response.status(200).send(responseData);
	},
	"default" : function(response){
        response.status(400).send("Algorithm code invalid");
	}
}
