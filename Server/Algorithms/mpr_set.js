/*
This module will contain the MPR Set algorithm
implementation.
It will split it in calculating the MPR set
first and then the minimized CDS.
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

var MPR_cds = function(){ 
	var that = this;
	that.solutionMPR = solutionFactory.solution();
	that.solutionCDS = solutionFactory.solution();
	that.solution = {
		"final_result" : [],
		"MPR_set" : that.solutionMPR, 
		"MPR_cds" : that.solutionCDS
	}
	that.calculate_MPR_CDS = function(network){
		that.solution["MPR_set"].result["dominators"] = _constructMPR(network, that.solution);
	}
}


var _constructMPR = function(network, solution){

}


module.exports.MPR_cds = new MPR_cds();