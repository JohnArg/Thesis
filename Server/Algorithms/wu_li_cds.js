/*
This module will contain the Wu&Li CDS algorithm
implementation.
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

var WuLiFactory = function(){
	return new Wu_Li_CDS();
}

//Main object to be returned
var Wu_Li_CDS = function(){
	var that = this;
	that.step1Solution = solutionFactory.newSolution();
	that.rule1Solution = solutionFactory.newSolution();
	that.rule2Solution = solutionFactory.newSolution();
	that.solution = { //This object will contain a solution object for each of the 3 parts of the algorithm 
		"step1" : that.step1Solution, 
		"rule1" : that.rule1Solution,
		"rule2" : that.rule2Solution
	};

	//This function will use the Wu & Li algorithm to find a minimum CDS
	that.calculateWuLi = function(network){
		_covertToWuLiNodes(network);
		that.solution["step1"].result["dominators"] = _implementWLStep1(network, that.solution);
		that.solution["rule1"].result["dominators"] = _implementWLRule1(network, that.solution["step1"].result["dominators"], that.solution);
		that.solution["rule2"].result["dominators"] = _implementWLRule2(network, that.solution["rule1"].result["dominators"], that.solution);
		return that.solution;
	};
}

//Adds data to the nodes
var _covertToWuLiNodes = function(network){
	for(var i=0; i<network.nodes.length; i++){
		network.nodes[i].dominator = false;	//initially all are dominatees
	}
}

//Returns true if the given node has a neighbor with the given id 
var _hasNeighbor = function (node, id){
	for(var i=0; i<node.neighbors.length; i++){
		if(id == node.neighbors[i]){
			return true;
		}
	}
	return false;
}

//Checks if list is a subset of the superSet
//We asume that the lists contain int values only
var _isSubsetOf = function(list, superSet){
	var found;
	for(var i=0; i<list.length; i++){
		found=false;
		for(var j=0; j<superSet.length; j++){
			if(list[i] == superSet[j]){
				found = true;
			}
		}
		if(!found){
			return false;
		}
	}	
	return true;
}

//Implements first step of the Wu&Li algorithm
var _implementWLStep1 = function(network, solution){
	var dominatorList = [];
	solution["step1"].text = "Constructing minimum Connected Dominating Set with Jie Wu and Hailan Li's algorithm.<br/>\
	<strong>Part 1 :</strong> We use a marking process. Initially all nodes are marked as F (dominatees).\
	All nodes exchange their open neighbor sets with their neighbors. In this step, if a node has 2 unconnected neighbors,\
	it marks itself as T (dominator). <br/>";
	//Initial decision without Rule1 && Rule 2 ========
	//for every node
	for(var i=0; i<network.nodes.length; i++){
		let neighborsConnected = true;
		//for every neighbor of that node
		solution["step1"].createStep();
		solution["step1"].steps[i].text = "Checking Node " + network.nodes[i].id + ".";
		for(var j=0; j<network.nodes[i].neighbors.length; j++){
			let tempNode = network.nodes[netOperator.returnNodeIndexById(network.nodes[i].neighbors[j], network)];
			let neighborCheckList = network.nodes[i].neighbors;
			for(var k=0; k<neighborCheckList.length; k++){
				if(neighborCheckList[k] != tempNode.id){	//skip checking my own id
					if(!_hasNeighbor(tempNode, neighborCheckList[k])){
						neighborsConnected = false;
						solution["step1"].steps[i].text += " Neighbors "+tempNode.id+" and "+neighborCheckList[k]+" are unconnected.</br>";
						break;
					}
				}
			}
			if(!neighborsConnected){
				dominatorList.push(network.nodes[i].id);
				network.nodes[i].dominator = true;
				solution["step1"].steps[i].text += " Node "+network.nodes[i].id+" is marked as T (dominator).";
				solution["step1"].steps[i].data = { "dominators" : dominatorList.slice()};
				break; //no need to check the other neighbors
			}
		}
		if(neighborsConnected){
			solution["step1"].steps[i].text += " Node "+network.nodes[i].id+" remains marked as F (dominatee).";
			solution["step1"].steps[i].data = { "dominators" : dominatorList.slice()};
		}
	}
	return dominatorList;
}

//Return the 2-hop neighbor candidates for Rule 1
var _returnRule1Candidates = function(index, network){
	var twoHopNeighbors = [];
	var oneHopNeighbors = network.nodes[index].neighbors;
	//take all the 2-hop neighbors
	for(var j=0; j<oneHopNeighbors.length; j++){
		let tempNode = netOperator.returnNodeById(oneHopNeighbors[j], network);
		for(var k=0; k<tempNode.neighbors.length; k++){
			let tempNode2Hop = netOperator.returnNodeById(tempNode.neighbors[k], network);
			if((tempNode2Hop.dominator)	//if it is a dominator
			&& (tempNode2Hop.id > network.nodes[index].id) //it has bigger id than the original node
			&&(_.indexOf(oneHopNeighbors, tempNode2Hop) == -1)){ //it's not a 1-hop neighbor
				twoHopNeighbors.push(tempNode.neighbors[k]);
			}
		}
	}
	//delete possible duplicate ids
	twoHopNeighbors = _.uniq(twoHopNeighbors);
	return twoHopNeighbors;
}

//Implements the Rule 1 of the algorithm
var _implementWLRule1 = function(network, dominatorList, solution){
	var curNode;
	var checkNodeList;
	var otherDom;
	var reducedNeighborSet;
	var newDominatorList = dominatorList;
	solution["rule1"].text = "<strong>Rule 1 :</strong> Consider 2 dominator nodes <strong>a</strong> and <strong>b</strong>. \
	If the neighborhood of <strong>a</strong> is a subset of the neighborhood of <strong>b</strong>\
	and id of node <strong>a</strong> < id of <strong>b</strong>, mark <strong>a</strong> as F (dominatee).";
	//Traverse the list of the dominators
	if(dominatorList.length > 1){
		for( var p=0; p<dominatorList.length; p++){
			solution["rule1"].createStep();  
			//get the dominator node object
			let index = netOperator.returnNodeIndexById(dominatorList[p], network);
			curNode = network.nodes[index];
			solution["rule1"].steps[p].text = "Checking node "+dominatorList[p]+".</br>"; 
			//get the 2-hop neighbors that are dominators with bigger ids
			//Only they are candidates for Rule 1
			checkNodeList = _returnRule1Candidates(index, network);
			//this is needed for the dominator with the highest id
			if(checkNodeList.length == 0){
				solution["rule1"].steps[p].text = "No other dominator covers the neighborhood of "+curNode.id+".</br>";
				solution["rule1"].steps[p].text += "Node "+curNode.id+" remains a dominator.";	
				solution["rule1"].steps[p].data = { "dominators" : newDominatorList.slice()};
				continue;
			}
			//for every other dominator "otherDom" of that list, check if the neighbors of curNode are a
			//subset of the neighbors of otherDom
			let success = false;
			for(var d=0; d<checkNodeList.length; d++){
				otherDom = network.nodes[netOperator.returnNodeIndexById(checkNodeList[d], network)];
				/*curNode will have otherDom as neighbor but of course otherDom won't have itself. 
				So we use a temporaty list of curNode's neighbors without otherDom, for subset comparison. 
				*/
				reducedNeighborSet = curNode.neighbors.filter(function(index) { 
					return index != checkNodeList[d];
				});
				if(_isSubsetOf(reducedNeighborSet, otherDom.neighbors)){
					success = true;
					break;
				}	
			}
			//if another node does cover the neighborhood of this dominator
			if(success){
				//the new list won't contain this node
				newDominatorList = newDominatorList.filter(function(el){
					return el != curNode.id;
				});
				solution["rule1"].steps[p].text = "Dominator neighbor "+otherDom.id+" covers the neighborhood of "+curNode.id+".</br>";
				solution["rule1"].steps[p].text += "Node "+curNode.id+" is marked as F (dominatee).";
				curNode.dominator = false;
				solution["rule1"].steps[p].data = { "dominators" : newDominatorList.slice()};
			}
			else{
				solution["rule1"].steps[p].text = "No other dominator covers the neighborhood of "+curNode.id+".</br>";
				solution["rule1"].steps[p].text += "Node "+curNode.id+" remains a dominator.";	
				solution["rule1"].steps[p].data = { "dominators" : newDominatorList.slice()};
			}
		}
	}
	else{
		solution["rule1"].createStep();
		solution["rule1"].steps[0].text = "No need to check only one dominator.";
		solution["rule1"].steps[0].data = { "dominators" : newDominatorList.slice()};
	}
	return newDominatorList;
}

//Implements Rule 2
var _implementWLRule2 = function(network, dominatorList, solution){
	var curDom;
	var domNeighbors = [];
	var unionSet;
	var success; //used for deciding the appropriate text for a step
	var newDominatorList = dominatorList;
	solution["rule2"].text = "<strong>Rule 2 :</strong> Consider 2 dominator nodes <strong>a</strong> and <strong>b</strong> that are both neighbors\
	 of another dominator <strong>w</strong>. If the neihborhood of <strong>w</strong> is a subset of the union of the neighborhoods of <strong>a</strong>\
	  and <strong>b</strong> and id of w = min{id of w, id of a, if of b}, then mark w as F (dominatee)."; 
	if(dominatorList.length > 1){
		//Traverse the dominators list
		for(var g=0; g< dominatorList.length; g++){
			success = false;
			//get the current node
			curDom = network.nodes[netOperator.returnNodeIndexById(dominatorList[g], network)];
			solution["rule2"].createStep();
			solution["rule2"].steps[g].text = "Checking node : "+dominatorList[g]+".<br/>";
			//get his dominator neighbors only
			domNeighbors = curDom.neighbors.filter(function(elem) {
				return network.nodes[netOperator.returnNodeIndexById(elem, network)].dominator;
			});
			//for each one of these neighbors in the previous list
			for(var n=0; n<domNeighbors.length; n++){
				/*get all the other neighbors of that list and check if the union of their neighbor sets can
				contain all the neighbors of curDom */
				for(var t=n+1; t<domNeighbors.length; t++){
					unionSet = _.union(network.nodes[netOperator.returnNodeIndexById(domNeighbors[n], network)].neighbors, 
						network.nodes[netOperator.returnNodeIndexById(domNeighbors[t], network)].neighbors );	
					if(_isSubsetOf(curDom.neighbors, unionSet) && (curDom.id<domNeighbors[n]) && (curDom.id < domNeighbors[t]) ){
						solution["rule2"].steps[g].text += "Node's "+dominatorList[g]+" neighborhood is covered by\
						 nodes "+domNeighbors[n]+" and "+domNeighbors[t]+".";
						success = true;
						currNode.dominator = false;
						newDominatorList = newDominatorList.filter(function(index) {
							return index != curDom.id;
						});
						break;
					}
				}
				if(success){ //curDom's neighborhood is covered. No need for additional checking.
					break;
				}
			}
			if(!success){
				solution["rule2"].steps[g].text += "Node's "+dominatorList[g]+" neighborhood is not covered by two dominator neighbors.";
			}
			solution["rule2"].steps[g].data = { "dominators" : newDominatorList.slice()};
		}
	}
	else{
		solution["rule2"].createStep();
		solution["rule2"].steps[0].text = "No need to check only one dominator.";
		solution["rule2"].steps[0].data = { "dominators" : newDominatorList.slice()};
	}
	return newDominatorList;
}

module.exports.WuLiFactory = WuLiFactory;