/*
This module will contain the MPR Set algorithm
implementation.
It will split it in calculating the MPR set
first and then the minimized CDS.
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

var mprFactory = function(){
	return new MPR_cds();
}

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
		that.solution["MPR_set"].result["All_MPR_sets"] = _constructMPR(network, that.solution);
		//testing code
		that.solution["MPR_cds"].result = { "dominators" : []};
		that.solution["MPR_cds"].steps = [];
		that.solution["MPR_cds"].text = "Work in progress";
		return that.solution;
	}
}

//Return the 2-hop neighborhood of this node
var _return2HopNeighbors = function(index, network){
	var twoHopNeighbors = [];
	var oneHopNeighbors = network.nodes[index].neighbors.slice();
	var tempNode;
	//take all the 2-hop neighbors
	for(var j=0; j<oneHopNeighbors.length; j++){
		tempNode = netOperator.returnNodeById(oneHopNeighbors[j], network);
		for(var k=0; k<tempNode.neighbors.length; k++){
			if( (_.indexOf(oneHopNeighbors, tempNode.neighbors[k]) == -1) 
				&& (tempNode.neighbors[k]!= network.nodes[index].id) ){ //make sure it's not a 1-hop neighbor
				twoHopNeighbors.push(tempNode.neighbors[k]);
			}
		}
	}
	//delete possible duplicate ids
	twoHopNeighbors = _.uniq(twoHopNeighbors);
	return twoHopNeighbors;
}

//From all the 2-hop neighbors check with how many of the 1-hop they are connected to. 
//If it's only with 1, add this one to the MPR set.
var _calculateTheFirstMprNodes = function(solution, index, network, mpr_set, twoHopNeighbors, oneHopNeighbors){
	var temp2hop = twoHopNeighbors.slice(); //will become the new 2hop neighborhood list
	var change = false;
	var twoHopCovered = [];
	var tempNode;
	var tempNode2;
	var intersect;
	solution["MPR_set"].steps[index].text += "First we will check which of the 2-hop neighbors connect only with one 1-hop neighbor and then we \
	will add their 1-hop neighbors to the MPR set of the node.</br>";
	for(var g=0; g<twoHopNeighbors.length; g++){
		tempNode = netOperator.returnNodeById(twoHopNeighbors[g], network);
		intersect = _.intersection(tempNode.neighbors, oneHopNeighbors);
		if((intersect.length == 1) && (_.indexOf(mpr_set, intersect[0]) == -1)){
				change = true;
				mpr_set.push(intersect[0]);
				tempNode2 = netOperator.returnNodeById(intersect[0], network);
				twoHopCovered = _.intersection(tempNode2.neighbors, twoHopNeighbors);
				temp2hop = _.difference(temp2hop, twoHopCovered); //the remaining uncovered 2-hop neighbors
				solution["MPR_set"].steps[index].text += "Added node "+intersect[0]+" .</br>";
		} 
	}
	if(!change){
		solution["MPR_set"].steps[index].text += "No change made in this step.</br>";
	}
	return { "twoHop" : temp2hop.slice(), "mpr" : mpr_set.slice()};
}

//This is used to add each time in the MPR set the 1-hop neighbors that cover the most 2-hop neighbors  
var _calculate2HopStep2 = function(step_index, network, solution, twoHopNeighbors, oneHopNeighbors, mpr_set, allMPRs){
	var coverageList;
	var tempNode;
	var intersect;
	//Add the 1-hop node with the biggest coverage until all 2-hop neighborhood is covered
	while(twoHopNeighbors.length > 0){
		//Get how many 2-hop nodes are covered by each 1-hop
		//Each entry in the coverageList corresponds to the same indexed entry in oneHopNeighbors
		oneHopNeighbors = _.difference(oneHopNeighbors, mpr_set);
		coverageList = [];
		for(var t=0; t<oneHopNeighbors.length; t++){
			tempNode = netOperator.returnNodeById(oneHopNeighbors[t], network);
			intersect = _.intersection(tempNode.neighbors, twoHopNeighbors);
			coverageList.push({"coverage" : intersect.length, "nodes" : intersect.slice()});
		}
		//Add the node with the maximum coverage to the MPR set
		var max = 0;
		for(var e=0; e<coverageList.length; e++){
			if(coverageList[e]["coverage"] > coverageList[max]["coverage"]){
				max = e;
			}
		}
		if(coverageList[max]["coverage"] > 0){
			mpr_set.push(oneHopNeighbors[max]);
			solution["MPR_set"].steps[step_index].text += "Added node "+oneHopNeighbors[max]+" .<br/>";
			//remove from the 2-hop neighborhood all those who were covered by this node
			twoHopNeighbors = _.difference(twoHopNeighbors, coverageList[max]["nodes"]);
		}
		else{ break;}
	}
	//add this mpr_set to all mprs data
	allMPRs.push(mpr_set);
	solution["MPR_set"].steps[step_index].data = {"mpr_set" : mpr_set.slice()};
	return allMPRs;
}

//The main function called to construct the MPR set of each node
var _constructMPR = function(network, solution){
	var twoHopNeighbors;
	var oneHopNeighbors;
	var mpr_set;
	var allMPRs = [];
	var step1Result;
	solution["MPR_set"].text = "Constructing a Connected Dominating Set with Multipoint Relays (MPR).</br> In this phase we construct the MPR set of each node.";
	//for each node in the network
	for(var i=0; i<network.nodes.length; i++){
		solution["MPR_set"].createStep();
		solution["MPR_set"].steps[i].text = "Calculating MPR set of node : "+network.nodes[i].id+".</br>";
		mpr_set = [];
		oneHopNeighbors = network.nodes[i].neighbors.slice();
		twoHopNeighbors = _return2HopNeighbors(i, network);
		solution["MPR_set"].steps[i].text += "2-Hop Neighbors : [ "+twoHopNeighbors.slice()+" ].</br>";
		if(twoHopNeighbors.length == 0){
			solution["MPR_set"].steps[i].text += "There isn't a 2-hop neighborhood to cover.</br>";
			solution["MPR_set"].steps[i].data = {"mpr_set" : []};
			allMPRs.push([]);
			continue;
		}
		//Add the first 1-hop neighbors that are essential to the set (look at _calculateTheFirstMprNodes() description)
		step1Result = _calculateTheFirstMprNodes(solution, i, network, mpr_set, twoHopNeighbors, oneHopNeighbors);
		twoHopNeighbors = step1Result["twoHop"];
		mpr_set = step1Result["mpr"];
		if(twoHopNeighbors.length > 0){
			solution["MPR_set"].steps[i].text += "2-hop neighbors remaining to cover: [ "+twoHopNeighbors+" ].</br>";
			solution["MPR_set"].steps[i].text += "Now, each time we will add to the MPR set the node who connects to the most 2-hop neighbors,\
			 until all 2-hop neighborhood is covered.</br>";
		}
		else{
			solution["MPR_set"].steps[i].text += "All 2-hop neighborhood covered.</br>";
		}
		//Now add the rest of the 1-hops to cover the entire 2-hop neighborhood (see _calculate2HopStep2() description)
		allMPRs = _calculate2HopStep2(i, network, solution, twoHopNeighbors, oneHopNeighbors, mpr_set, allMPRs);
	}
	return allMPRs;
}

module.exports.MPR_Factory = mprFactory;