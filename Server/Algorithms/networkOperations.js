/*
This module will contain functions to perform 
network operations
*/
var netOperatorFactory = function(){
	return new netOperator();
}

var netOperator = function(){
	var that = this;
	this.returnNodeById = function(search_id, network){
	 	if(network.nodes.length == 0){
	 		console.log("Can't retrieve node from empty network");
	 	}
	 	else{
	 		for(var i=0; i<network.nodes.length; i++){
	 			if(network.nodes[i].id == search_id){
	 				return network.nodes[i];
	 			}
	 		}
		}
	};
	this.returnNodeIndexById = function(search_id, network){
		if(network.nodes.length == 0){
	 		console.log("Can't retrieve node from empty network");
	 	}
	 	else{
	 		for(var i=0; i<network.nodes.length; i++){
	 			if(network.nodes[i].id == search_id){
	 				return i;
	 			}
	 		}
		}
	};
	this.returnNeighborObjects = function(node, network){
		var neighbors = [];
		for(var j=0; j<node.neighbors.length; j++){
			neighbors.push( that.returnNodeById(node.neighbors[j], network) );
		}
		return neighbors;
	};
}

module.exports.netOperator = netOperatorFactory();