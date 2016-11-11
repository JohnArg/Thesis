/*
This module will implement the DCA clusters
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

var dcaFactory = function(){
	return new DCA_clusters();
}

//main object to be returned
var DCA_clusters = function(){ 
	var that = this;
	that.solutionDCA = solutionFactory.solution();
	that.solution = {
		"final_result" : [],
		"DCA_clusters" : that.solutionDCA
	};
	that.calculate_DCA_Clusters = function(network, extras){
		return that.solution;
	}
}

//returns the weights of the neighbors of the given node
var weightsOfNeighbors = function(){

}

module.exports.dcaFactory = dcaFactory;
