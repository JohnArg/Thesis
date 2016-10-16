/*
This module will contain functions to perform 
network operations
*/
var netOperator = function(){
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
}

module.exports.netOperator = new netOperator();