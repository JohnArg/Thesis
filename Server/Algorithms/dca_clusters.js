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
		_stepSimulator(network);
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
	console.log("Node "+node.id+" sent CH");
	//send a CH message
	node.clusterhead = node.id;
	node.cluster.push(node.id);
}

//Simulates sending a JOIN message to the neighborhood
var _sendJOIN = function(node, clusterhead, network){
	console.log("Node "+node.id+" sent JOIN ("+node.id+","+clusterhead.id+") and Exited");
	node.EXIT = true;
}

//Called when a node receives CH
var _receiveCH = function(node, sender, network, timestep){
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
		node.toSend = {"type" : "JOIN", "receiver" : sender.id, "timestep" : (timestep+1)};
	}
}

//How a clusterhead handles a JOIN message
var _clusterheadHandlesJOIN = function(receiver, sender, clusterhead, smallerWeightNeighbors, network){
	//if  the JOIN is for me
	if(clusterhead.id == receiver.id){
		receiver.cluster.push(sender.id);
		console.log("Clusterhead "+receiver.id+" put node "+sender.id+" to its cluster.");
	}
	//if all the smaller weighted neighbors joined someone else exit
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
}

//Called when a node receives JOIN
var _receiveJOIN = function(receiver, sender, clusterhead, network, timestep){
	console.log("Node "+receiver.id+" received JOIN ("+sender.id+","+clusterhead.id+")");
	var smallerWeightNeighbors = [];
	var tempNode;
	var conditionOR; //boolean
	var conditionJOIN; //boolean
	receiver.JOIN_messagesInbox.push({"sender": sender.id, "clusterhead" : clusterhead.id});
	//get the neighbors with smaller weight than me, we are going to need them later
	for(var i=0; i<receiver.neighbors.length; i++){
		tempNode = netOperator.returnNodeById(receiver.neighbors[i], network);
		if(tempNode.weight < receiver.weight){
			smallerWeightNeighbors.push(tempNode);
		}
	}
	//if i am a clusterhead
	if(receiver.clusterhead == receiver.id){
		_clusterheadHandlesJOIN(receiver, sender, clusterhead, smallerWeightNeighbors, network);
	}
	else{
		//get the neighbors with bigger weight than mine and check if they have all sent CH or JOIN
		conditionOR = false;
		conditionJOIN = true;
		for(var i=0; i<receiver.neighbors.length; i++){
			tempNode = netOperator.returnNodeById(receiver.neighbors[i], network);
			if(tempNode.weight > receiver.weight){
				conditionOR = _checkIfNodeSent("CH", receiver, tempNode) || _checkIfNodeSent("JOIN", receiver, tempNode);
				conditionJOIN = conditionJOIN && _checkIfNodeSent("JOIN", receiver, tempNode);
				if(!conditionOR){
					break;
				}
			}
		}
		if(conditionOR){
			if(conditionJOIN){ //if they all sent JOIN
				//become clusterhead
				receiver.cluster.push(receiver);
				receiver.clusterhead = receiver.id;
				receiver.toSend = {"type" : "CH", "timestep" : (timestep+1)};
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
				receiver.toSend = {"type" : "JOIN", "receiver" : clusterhead.id, "timestep" : (timestep+1)};
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
	console.log("Time step 1 ==================================");
	var greaterWeight;
	var receiveQueue = [];
	var neighbors = [];
	//First send the messages
	for(var i=0; i<network.nodes.length; i++){
		neighbors = netOperator.returnNeighborObjects(network.nodes[i], network);
		greaterWeight = true;
		for(var k=0; k<neighbors.length; k++){
			if(network.nodes[i].weight < neighbors[k].weight){
				greaterWeight = false;
				break;
			}
		}
		if(greaterWeight){
			_sendCH(network.nodes[i], network);
			for(var k=0; k<neighbors.length; k++){
				receiveQueue.push({"nodeToCall" : neighbors[k], "sender" : network.nodes[i]});
			}
		}
	}
	//Now call the receive methids
	for(var i=0; i<receiveQueue.length; i++){
		_receiveCH(receiveQueue[i]["nodeToCall"], receiveQueue[i]["sender"], network, 1);
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
	var neighbors;
	var timestep = 2;
	var receiveQueue = [];	//In an execution step receiving a message happens at the end, after sending all messages pending so far. 
							//So we use a queue to track which receive functions to call after all nodes have sent their messages.
	while(!_haveAllExited(network)){
	//while(timestep < 20){
		console.log("Time step"+timestep+"==================================");
		receiveQueue = [];
		//First send all pending messages for this step
		for(var i=0; i<network.nodes.length; i++){
			node = network.nodes[i];
			if(node.toSend["type"] != null){
				neighbors = netOperator.returnNeighborObjects(node, network);
				if((node.toSend["type"] == "CH") && (node.toSend["timestep"] == timestep)){
					_sendCH(node, network);
					for(var j=0; j<neighbors.length; j++){
						receiveQueue.push({"type" : "CH", "nodeToCall" : neighbors[j], "sender" : node});
					}
					node.toSend = {};
				}
				else if((node.toSend["type"] == "JOIN") && (node.toSend["timestep"] == timestep)){
					_sendJOIN(node, netOperator.returnNodeById(node.toSend["receiver"], network), network);
					for(var j=0; j<neighbors.length; j++){
						receiveQueue.push({"type" : "JOIN", "nodeToCall" : neighbors[j], "sender" : node, 
							"receiver" : netOperator.returnNodeById(node.toSend["receiver"], network)});
					}
					node.toSend = {};
				}
			}
		}
		//Now execute the receiving functions
		for(var i=0; i<receiveQueue.length; i++){
			if((receiveQueue[i]["type"] == "CH") && (receiveQueue[i]["nodeToCall"].EXIT == false)){
				_receiveCH(receiveQueue[i]["nodeToCall"], receiveQueue[i]["sender"], network, timestep);
			}
			else if((receiveQueue[i]["type"] == "JOIN") && (receiveQueue[i]["nodeToCall"].EXIT == false)){
				_receiveJOIN(receiveQueue[i]["nodeToCall"], receiveQueue[i]["sender"], receiveQueue[i]["receiver"], network, timestep);
			}
		}
		timestep ++;
	}
}

module.exports.dcaFactory = dcaFactory;
