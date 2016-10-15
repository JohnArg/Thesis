/*
This module will contain the Wu&Li CDS algorithm
implementation
*/
var _ = require('underscore');

var WuLi_Factory = function(network){
	//main object to be returned
	var Wu_Li_CDS = function(net){
		this.dominatorListWL = [];	//the dominators after Wu & Li's algorithm
		this.network = net;
		//Returns true if the given node has a neighbor with the given id 
		this.hasNeighbor = function (node, id){
			for(var i=0; i<node.neighbors.length; i++){
				if(id == node.neighbors[i]){
					return true;
				}
			}
			return false;
		}

		//Checks if one list is a subset of the superSet
		//We asume that the lists contain numeric values only
		this.isSubsetOf = function(list, superSet){
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
		this.isDominator(node){
			for(var i=0; i<dominatorList.length; i++){
				if(node.id == dominatorList[i]){
					return true;
				}
			}
			return false;
		}

		//Implements first step of the Wu&Li algorithm
		this.implementWLStep1 = function(){
			var neighborsConnected = true;
			var tempNode;
			dominatorListWL = [];
			//Initial decision without Rule1 && Rule 2 ========
			//for every node
			for(var i=0; i<network.nodes.length; i++){
				//for every neighbor of that node
				for(var j=0; j<network.nodes[i].neighbors.length; j++){
					//get a list of all the other neighbors than the current one
					neighborCheckList = network.nodes[i].neighbors.filter(function(el){
						return el != network.nodes[i].neighbors[j]; 
					});
					if(neighborCheckList.length > 0){
						//Is j connected to all the other neighbor nodes?
						tempNode = network.nodes[ returnNodeIndexById(network.nodes[i].neighbors[j])];
						for(var k=0; k<neighborCheckList.length; k++){
							if( !hasNeighbor(tempNode, neighborCheckList[k]) ){
								neighborsConnected = false;
								break;
							}
						}
					}
					if(!neighborsConnected){
						dominatorListWL.push(network.nodes[i].id);
						neighborsConnected = true;
						break; //no need to check the other neighbors
					}
				}
			}
		}

		//This function implements the Rule 1 of the algorithm
		this.implementWLRule1 = function(){
			var curNode;
			var checkNodeList;
			var otherDom;
			var p=0;
			var resetP = false;
			var reducedNeighborSet;
			//Traverse the list of the dominators
			while( p<dominatorListWL.length){
				//get the dominator node object
				curNode = network.nodes[returnNodeIndexById(dominatorListWL[p])];
				//get the rest of the dominators
				checkNodeList = dominatorListWL.filter(function(el){
					return el != dominatorListWL[p];
				});
				//for every other dominator, check if the neighbors of p are a
				//subset of the neighbors of that other dominator
				for(var d=0; d<checkNodeList.length; d++){
					otherDom = network.nodes[ returnNodeIndexById(checkNodeList[d])];
					//If you're checking for subsets, don't include in your neighborset the node you're checking against
					//if he is your neighbor.Otherwise the subset comparison will check if the other node has himself
					//as a neighbor, which will be always false.
					reducedNeighborSet = curNode.neighbors.filter(function(index) { 
						return index != checkNodeList[d];
					});
					if(isSubsetOf(reducedNeighborSet, otherDom.neighbors)){
						if(curNode.id < otherDom.id){
							dominatorListWL = checkNodeList;
							resetP = true;
						}
					}
				}
				if(resetP){
					p = 0;
					resetP = false;
				}
				else{
					p++;
				}
			}
		}

		this.implementWLRule2 = function(){
			var g=0;
			var resetG = false;
			var curDom;
			var domNeighbors = [];
			var remainingDomNeighbors;
			var unionSet;
			var reducedChecklist;
			//Traverse the dominators list
			while(g < dominatorListWL.length){
				//get the current node
				curDom = network.nodes[ returnNodeIndexById(dominatorListWL[g]) ];
				//get the dominator neighbors only
				domNeighbors = curDom.neighbors.filter(function(elem) {
					return isDominator(returnNodeIndexById(elem)) == true ;
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
						if(hasNeighbor( network.nodes[ returnNodeIndexById(domNeighbors[n])], remainingDomNeighbors[t]) ){
							unionSet = _.union(network.nodes[ returnNodeIndexById(domNeighbors[n])].neighbors, 
											network.nodes[ returnNodeIndexById(remainingDomNeighbors[t])].neighbors );
							/*If you're checking for subsets, don't include in your neighborset the node you're checking against
							if he is your neighbor.Otherwise the subset comparison will check if the other node has himself
							as a neighbor, which will be always false. */
							reducedChecklist = curDom.neighbors.filter(function(index) {
								return ( (index != domNeighbors[n]) && (index != remainingDomNeighbors[t]) );
							});
							if(isSubsetOf(reducedChecklist, unionSet) && (curDom.id<domNeighbors[n]) && (curDom.id < remainingDomNeighbors[t]) ){
								dominatorListWL = dominatorListWL.filter(function(index) {
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
		}

		/* 
		This function will use the Wu & Li algorithm to find a minimum ================================
		CDS, but not k,m connected	
		*/
		this.calculateWuLi = function(){	
			implementWLStep1();
			implementWLRule1();
			implementWLRule2();
		}
	}

	return new Wu_Li_CDS(network);
}

module.exports.WuLi = WuLi_Factory;