/*
This module will contain the Wu&Li CDS algorithm
implementation.
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");
var step1Solution;
var rule1Solution;
var rule2Solution;
var solution;

//main object to be returned
var Wu_Li_CDS = function(){
	//This function will use the Wu & Li algorithm to find a minimum CDS
	this.calculateWuLi = function(network){
		step1Solution = solutionFactory.solution();
		rule1Solution = solutionFactory.solution();
		rule2Solution = solutionFactory.solution();
		solution = {	//This object will contain a solution object for each of the 3 parts of the algorithm
			"final_result" : [], //--> Although "rule2" has the final result, the viewManager.js response handler in the Client  
			"step1" : step1Solution, // is written to work with many algorithms and it doesn't know where esle and how the final
			"rule1" : rule1Solution, // result is stored
			"rule2" : rule2Solution
		};
		solution["step1"].result["dominators"] = _implementWLStep1(network);
		solution["rule1"].result["dominators"] = _implementWLRule1(network, solution["step1"].result["dominators"]);
		solution["rule2"].result["dominators"] = _implementWLRule2(network, solution["rule1"].result["dominators"]);
		solution["final_result"] = solution["rule2"].result["dominators"];
		return solution;
	};
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

//Checks if one list is a subset of the superSet
//We asume that the lists contain numeric values only
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

//checks if a node is dominator
var _isDominator = function(node, dominatorList){
	for(var i=0; i<dominatorList.length; i++){
		if(node.id == dominatorList[i]){
			return true;
		}
	}
	return false;
}

//Implements first step of the Wu&Li algorithm
var _implementWLStep1 = function(network){
	var neighborsConnected = true;
	var tempNode;
	dominatorList = [];
	solution["step1"].text = "Constructing minimum Connected Dominating Set with Jie Wu and Hailan Li's algorithm.<br/>\
	<strong>Part 1 :</strong> We use a marking process. Initially all nodes are marked as F (dominatees).\
	All nodes exchange their open neighbor sets with their neighbors. In this step, if a node has 2 unconnected neighbors,\
	it marks itself as T (dominator). <br/>";
	//Initial decision without Rule1 && Rule 2 ========
	//for every node
	for(var i=0; i<network.nodes.length; i++){
		//for every neighbor of that node
		solution["step1"].createStep();
		solution["step1"].steps[i].text = "Checking Node " + network.nodes[i].id + ".";
		for(var j=0; j<network.nodes[i].neighbors.length; j++){
			//get a list of all the other neighbors than the current one
			neighborCheckList = network.nodes[i].neighbors.filter(function(el){
				return el != network.nodes[i].neighbors[j]; 
			});
			if(neighborCheckList.length > 0){
				//Is j connected to all the other neighbor nodes?
				tempNode = network.nodes[netOperator.returnNodeIndexById(network.nodes[i].neighbors[j], network)];
				for(var k=0; k<neighborCheckList.length; k++){
					if(!_hasNeighbor(tempNode, neighborCheckList[k])){
						neighborsConnected = false;
						solution["step1"].steps[i].text += " Neighbors "+tempNode.id+" and "+neighborCheckList[k]+" are unconnected.</br>";
						break;
					}
				}
			}
			if(!neighborsConnected){
				dominatorList.push(network.nodes[i].id);
				solution["step1"].steps[i].text += " Node "+network.nodes[i].id+" is marked as T (dominator).";
				solution["step1"].steps[i].data = { "dominators" : dominatorList.slice()};
				neighborsConnected = true;
				break; //no need to check the other neighbors
			}else{
				solution["step1"].steps[i].text += " Node "+network.nodes[i].id+" remains marked as F (dominatee).";
				solution["step1"].steps[i].data = { "dominators" : dominatorList.slice()};
			}
		}
	}
	return dominatorList;
}

//This function implements the Rule 1 of the algorithm
var _implementWLRule1 = function(network, dominatorList){
	var curNode;
	var checkNodeList;
	var otherDom;
	var reducedNeighborSet;
	solution["rule1"].text = "<strong>Rule 1 :</strong> Consider 2 dominator nodes <strong>a</strong> and <strong>b</strong>. \
	If the neighborhood of <strong>a</strong> is a subset of the neighborhood of <strong>b</strong>\
	and id of node <strong>a</strong> < id of <strong>b</strong>, mark <strong>a</strong> as F (dominatee).";
	//Traverse the list of the dominators
	for( var p=0; p<dominatorList.length; p++){
		solution["rule1"].createStep();  
		//get the dominator node object
		curNode = network.nodes[netOperator.returnNodeIndexById(dominatorList[p], network)];
		solution["rule1"].steps[p].text = "Checking node "+dominatorList[p]+".</br>"; 
		//get the rest of the dominators
		checkNodeList = dominatorList.filter(function(el){
			return el != dominatorList[p];
		});
		//for every other dominator, check if the neighbors of p are a
		//subset of the neighbors of that other dominator
		for(var d=0; d<checkNodeList.length; d++){
			otherDom = network.nodes[netOperator.returnNodeIndexById(checkNodeList[d], network)];
			//If you're checking for subsets, don't include in your neighborset the node you're checking against
			//if he is your neighbor.Otherwise the subset comparison will check if the other node has himself
			//as a neighbor, which will be always false.
			reducedNeighborSet = curNode.neighbors.filter(function(index) { 
				return index != checkNodeList[d];
			});
			if(_isSubsetOf(reducedNeighborSet, otherDom.neighbors) && (curNode.id < otherDom.id) ){
				dominatorList = checkNodeList;
				solution["rule1"].steps[p].text = "Dominator neighbor "+otherDom.id+" covers the neighborhood of "+dominatorList[p]+".</br>";
				solution["rule1"].steps[p].text += "Node "+dominatorList[p]+" is marked as F (dominatee).";
				solution["rule1"].steps[p].data = { "dominators" : dominatorList.slice()};
			}
			else{
				solution["rule1"].steps[p].text = "No other dominator neighbor covers the neighborhood of "+dominatorList[p]+".</br>";
				solution["rule1"].steps[p].text += "Node "+dominatorList[p]+" remains a dominator.";	
				solution["rule1"].steps[p].data = { "dominators" : dominatorList.slice()};
			}
		}
	}
	return dominatorList;
}

var _implementWLRule2 = function(network, dominatorList){
	var g=0;
	var resetG = false;
	var curDom;
	var domNeighbors = [];
	var remainingDomNeighbors;
	var unionSet;
	var reducedChecklist;
	solution["rule2"].text = "<strong>Rule 2 :</strong> Consider 2 dominator nodes <strong>a</strong> and <strong>b</strong> that are both neighbors\
	 of another dominator <strong>w</strong>. If the neihborhood of <strong>w</strong> is a subset of the union of the neighborhoods of <strong>a</strong>\
	  and <strong>b</strong> and id of w = min{id of w, id of a, if of b}, then mark w as F (dominatee)."; 

	//Traverse the dominators list
	while(g < dominatorList.length){
		//get the current node
		curDom = network.nodes[netOperator.returnNodeIndexById(dominatorList[g], network)];
		//get the dominator neighbors only
		domNeighbors = curDom.neighbors.filter(function(elem) {
			return _isDominator(netOperator.returnNodeIndexById(elem, network), dominatorList) == true ;
		});
		//for each one of these neighbors
		for(var n=0; n<domNeighbors.length; n++){
			//get all the other neighbors
			remainingDomNeighbors = domNeighbors.filter(function(index) {
				return index != domNeighbors[n];
			});
			//and check if this one is connected with any one of the others
			//if so, we must check if the union of their neighbor sets can
			//contain all the neighbors of curDom
			for(var t=0; t<remainingDomNeighbors.length; t++){
				if(_hasNeighbor( network.nodes[netOperator.returnNodeIndexById(domNeighbors[n], network)], remainingDomNeighbors[t]) ){
					unionSet = _.union(network.nodes[netOperator.returnNodeIndexById(domNeighbors[n], network)].neighbors, 
									network.nodes[netOperator.returnNodeIndexById(remainingDomNeighbors[t], network)].neighbors );
					/*If you're checking for subsets, don't include in your neighborset the node you're checking against
					if he is your neighbor.Otherwise the subset comparison will check if the other node has himself
					as a neighbor, which will be always false. */
					reducedChecklist = curDom.neighbors.filter(function(index) {
						return ( (index != domNeighbors[n]) && (index != remainingDomNeighbors[t]) );
					});
					if(_isSubsetOf(reducedChecklist, unionSet) && (curDom.id<domNeighbors[n]) && (curDom.id < remainingDomNeighbors[t]) ){
						dominatorList = dominatorList.filter(function(index) {
							return index != curDom.id;
						});
						resetG = true;
					}
				}
			}
		}
		if(resetG){
			g=0;
			resetG = false;
		}
		else{
			g++;
		}
	}//end while
	return dominatorList;
}

module.exports.WuLi = new Wu_Li_CDS();