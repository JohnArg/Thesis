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
	};
	that.calculate_MPR_CDS = function(network){
		that.solution["MPR_set"].result["dominators"] = _constructMPR(network, that.solution);
	}
}

var _constructMPR = function(network, solution){
	var twoHopNeighbors;
	var oneHopNeighbors;
	var intersect;
	var tempNode;
	var mpr_set;
	var coverageList; //will contain numbers indicating how many 2-hop neighbors a 1-hop node connects to
	var nodeId;
	var allMPRs = [];
	var max;
	//for each node in the network
	for(var i=0; i<network.nodes.length; i++){
		mpr_set = [];
		twoHopNeighbors = [];
		oneHopNeighbors = network.nodes[i].neighbors.slice();
		//take all the 2-hop neighbors
		for(var j=0; j<oneHopNeighbors.length; j++){
			tempNode = netOperator.returnNodeById(oneHopNeighbors[j], network);
			for(var k=0; k<tempNode.neighbors.length; k++){
				twoHopNeighbors.push(tempNode.neighbors[k]);
			}
		}
		//delete possible duplicate ids
		twoHopNeighbors = _.uniq(twoHopNeighbors);
		//Now from all the 2-hop neighbors check with how many of the 1-hop they are connected to. 
		//If it's only with 1, add this one to the MPR set.
		for(var g=0; g<twoHopNeighbors.length; g++){
			tempNode = netOperator.returnNodeById(twoHopNeighbors[g], network);
			intersect = _.intersection(tempNode.neighbors, oneHopNeighbors);
			if(intersect.length == 1){
				mpr_set.push(intersect[0]);
			} 
		}
		//Add the 1-hop node with the biggest coverage until all 2-hop neighborhood is covered
		while(twoHopNeighbors.length > 0){
			//Get how many 2-hop nodes are covered by each 1-hop
			//Each entry in the coverageList corresponds to the same indexed entry in oneHopNeighbors
			oneHopNeighbors = _.difference(oneHopNeighbors, mpr_set);
			coverageList = [];
			for(var t=0; t<oneHopNeighbors.length; t++){
				tempNode = netOperator.returnNodeById(oneHopNeighbors[t], network);
				intersect = _.intersection(tempNode.neighbors, twoHopNeighbors);
				coverageList.push(intersect.length);
			}
			//Add the node with the maximum coverage to the MPR set
			max = 0;
			for(var e=0; e<coverageList.length; e++){
				if(coverageList[e] > coverageList[max]){
					max = e;
				}
			}
			mpr_set.push(oneHopNeighbors[max]);

		}

	}

	
}


module.exports.MPR_cds = new MPR_cds();