/*
This module will implement the DCA clusters algorithm.
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

//Object factory
var dcaFactory = function(){
	return new DCA_clusters();
}

//Main object to be returned
var DCA_clusters = function(){ 
	var that = this;
	that.solution = {
		"final_result" : that.clusters,
		"DCA_solution" : {}
	};
	that.clusters = []; //the clsuters formed
	that.calculate_DCA_Clusters = function(network, extras){
		console.log("Weights : ", extras["weights"]);
		_changeToDcaNodes(network, extras["weights"]);
		_procedureInit(network);
		_stepSimulator(network)
		return that.solution;
	};
}

//A cluster object
var Cluster = function(){
	this.clusterhead = 0;
	this.group = [];
} 

//Inserts more data to the network object
var _changeToDcaNodes = function(network, weights){
	for(var i=0; i<network.nodes.length; i++){
		network.nodes[i].weight = weights[i];
		network.nodes[i].clusterhead = 0;
		network.nodes[i].cluster = [];
		network.nodes[i].CH_messagesInbox = [];	//will contain the CH messages received. Message format (sender id, sender weight).
		network.nodes[i].JOIN_messagesInbox = []; //will contain the JOIN messages received. Message format (sender id, sender weight).
		network.nodes[i].toSend = {};	//message to be sent in the next step of the execution.
		network.nodes[i].EXIT = false;
	}
}

//Checks if the given node has sent CH or JOIN
var _checkIfNodeSent = function(type, me, node){
	if(type == "CH"){
		for(var i=0; i<me.CH_messagesInbox.length; i++){
			if(me.CH_messagesInbox[i]["sender"] == node.id){
				return true;
			}
		}
	}
	else if (type == "JOIN"){
		for(var i=0; i<me.JOIN_messagesInbox.length; i++){
			if(me.JOIN_messagesInbox[i]["sender"] == node.id){
				return true;
			}
		}
	}
	return false;
}

//Simulates sending a CH message to the neighborhood
var _sendCH = function(node, network){
	var neighbors = netOperator.returnNeighborObjects(node, network);
	console.log("Node "+node.id+" sent CH");
	for(var i=0; i<neighbors.length; i++){
		//send a CH message
		node.clusterhead = node.id;
		node.cluster.push(node.id);
		for(var k=0; k<neighbors.length; k++){
			if(!neighbors[i].EXIT){
				_receiveCH(neighbors[k], node, network);
			}
		}
	}
}

//Simulates sending a JOIN message to the neighborhood
var _sendJOIN = function(node, clusterhead, network){
	var neighbors = netOperator.returnNeighborObjects(node, network);
	node.EXIT = true;
	console.log("Node "+node.id+" sent JOIN ("+node.id+","+clusterhead.id+") and Exited");
	for(var i=0; i<neighbors.length; i++){
		if(!neighbors[i].EXIT){
			_receiveJOIN(neighbors[i], node, clusterhead, network);
		}
	}
}

//Called when a node receives CH
var _receiveCH = function(node, sender, network){
	console.log("Node "+node.id+" received CH from "+sender.id);
	var biggerWeightNeighbors = [];
	var tempNode;
	node.CH_messagesInbox.push({"sender" : sender.id, "weight" : sender.weight});
	//get all the neighbors with bigger weights than the sender
	for(var i=0; i<node.neighbors.length; i++){
		tempNode = netOperator.returnNodeById(node.neighbors[i], network);
		if(tempNode.weight > sender.weight){
			biggerWeightNeighbors.push(tempNode);
		}
	}
	//if they all have sent JOIN messages then join this sender's cluster
	var allSent = true;
	for(var k=0; k<biggerWeightNeighbors.length; k++){
		if(!_checkIfNodeSent("JOIN", node, biggerWeightNeighbors[k])){
			allSent = false;
			break;
		}
	}
	if(allSent){
		node.clusterhead = sender.id;
		//send JOIN to sender
		node.toSend = {"type" : "JOIN", "receiver" : sender.id};
	}
}

//How a clusterhead handles a JOIN message
var _clusterheadHandlesJOIN = function(receiver, sender, clusterhead, network){
	var smallerWeightNeighbors = [];
	var tempNode;
	//if  the JOIN is for me
	if(clusterhead == receiver.id){
		receiver.cluster.push(sender.id);
		console.log("Clusterhead "+receiver.id+" put node "+sender.id+" to its cluster.");
	}
	//get all the neighbors with smaller weights than me
	for(var i=0; i<receiver.neighbors.length; i++){
		tempNode = netOperator.returnNodeById(receiver.neighbors[i], network);
		if(tempNode.weight < receiver.weight){
			smallerWeightNeighbors.push(tempNode);
		}
	}
	//if they all have joined someone else exit
	var allSent = true;
	for(var k=0; k<smallerWeightNeighbors.length; k++){
		if(!_checkIfNodeSent("JOIN", receiver, smallerWeightNeighbors[k])){
			allSent = false;
			break;
		}
	}
	if(allSent){
		receiver.EXIT = true;
		console.log("Clusterhead "+receiver.id+" Exited.");
	}
	return smallerWeightNeighbors; //they are needed in _receiveJOIN
}

//Called when a node receives JOIN
var _receiveJOIN = function(receiver, sender, clusterhead, network){
	console.log("Node "+receiver.id+" received JOIN ("+sender.id+","+clusterhead.id+")");
	var smallerWeightNeighbors;
	var tempNode;
	var condition1;
	var condition2;
	receiver.JOIN_messagesInbox.push({"sender": sender.id, "clusterhead" : clusterhead.id});
	//if i am a clusterhead
	if(receiver.clusterhead == receiver.id){
		smallerWeightNeighbors = _clusterheadHandlesJOIN(receiver, sender, clusterhead, network);
	}
	else{
		//get the neighbors with bigger weight than mine and check if they have all sent CH or JOIN
		condition1 = true;
		condition2 = true;
		for(var i=0; i<receiver.neighbors.length; i++){
			tempNode = netOperator.returnNodeById(receiver.neighbors[i], network);
			if(tempNode.weight > receiver.weight){
				condition1 = _checkIfNodeSent("CH", receiver, tempNode) && condition1;
				condition2 = _checkIfNodeSent("JOIN", receiver, tempNode) && condition2;
			}
		}
		if(condition1 || condition2){
			if(condition2){ //if they all sent JOIN
				//become clusterhead
				receiver.cluster.push(receiver);
				receiver.clusterhead = receiver.id;
				receiver.toSend = {"type" : "CH"};
				//if those with smaller weight have sent JOIN exit
				var exit = true;
				for(var n=0; n<smallerWeightNeighbors.length; n++){
					if(!_checkIfNodeSent("JOIN", receiver, smallerWeightNeighbors[n])){
						exit = false;
						break;
					}
				}
				if(exit){
					receiver.EXIT = true;
					console.log("Node "+receiver.id+" Exited.");
				}
			}
			else{ //they all sent CH
				//choose the clusterhead with the biggest weight and JOIN him
				receiver.clusterhead = _getBiggestClusterhead(receiver.CH_messagesInbox);
				receiver.toSend = {"type" : "JOIN", "receiver" : clusterhead.id};
			}
		}
	}
}

//Get the clusterhead with the biggest weight
var _getBiggestClusterhead = function(CH_inbox){
	var max = 0;
	for(var i=0; i<CH_inbox.length; i++){
		if(CH_inbox[i]["weight"] > CH_inbox[max]["weight"]){
			max = i;
		}
	}
	return CH_inbox[max]["sender"];
}

//Initial procedure : Those with the biggest ids in their neighborhood send CH
var _procedureInit = function(network){
	var neighborsWeights;
	var neighbor;
	var greaterWeight;
	for(var i=0; i<network.nodes.length; i++){
		neighborsWeights = [];
		for(var j=0; j<network.nodes[i].neighbors.length; j++){
			neighbor = netOperator.returnNodeById(network.nodes[i].neighbors[j], network);
			neighborsWeights.push(neighbor.weight);
		}
		greaterWeight = true;
		for(var k=0; k<neighborsWeights.length; k++){
			if(network.nodes[i].weight < neighborsWeights[k]){
				greaterWeight = false;
				break;
			}
		}
		if(greaterWeight){
			console.log("Node "+network.nodes[i].id+" sent CH");
			_sendCH(network.nodes[i], network);
		}
	}
}

//Have all nodes exited the execution?
var _haveAllExited = function(network){
	for(var i=0; i<network.nodes.length; i++){
		if(network.nodes[i].EXIT == false){
			return false;
		}
	}
	return true;
}

//It simulates the steps of execution for the algorithm after _procedureInit
var _stepSimulator = function(network){
	var node;
	var stepCounter = 1;
	while(!_haveAllExited(network)){
		console.log("Time step"+stepCounter+"==================================");
		for(var i=0; i<network.nodes.length; i++){
			node = network.nodes[i];
			if(node.toSend["type"] != null){
				if(node.toSend["type"] == "CH"){
					_sendCH(node, network);
					node.toSend = {};
				}
				else if(node.toSend["type"] == "JOIN"){
					_sendJOIN(node, netOperator.returnNodeById(node.toSend["receiver"], network), network);
					node.toSend = {};
				}
			}
		}
		stepCounter ++;
	}
}

module.exports.dcaFactory = dcaFactory;
