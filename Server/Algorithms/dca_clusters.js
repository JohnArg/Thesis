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
		"final_result" : [],
		"DCA_timesteps" : solutionFactory.newSolution()
	};
	that.calculate_DCA_Clusters = function(network, extras){
		console.log("Weights : "+extras["weights"]);
		_changeToDcaNodes(network, extras["weights"]);
		_procedureInit(network, that.solution["DCA_timesteps"]);
		_stepSimulator(network, that.solution["DCA_timesteps"]);
		that.solution["final_result"] = _returnClusters(network);
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
		network.nodes[i].CH_messagesInbox = [];	//will contain the CH messages received.
		network.nodes[i].JOIN_messagesInbox = []; //will contain the JOIN messages received.
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
var _sendCH = function(node, network, solution){
	var stepIndex;
	//solution.createStep();
	stepIndex = solution.steps.length - 1;
	solution.steps[stepIndex].text = "Node "+node.id+" broadcasted CH.";
	//send a CH message
	if(node.clusterhead != node.id){
		node.clusterhead = node.id;
		node.cluster.push(node.id);
	}
	solution.steps[stepIndex].data["clusters"] = _returnClusters(network);
}

//Simulates sending a JOIN message to the neighborhood
var _sendJOIN = function(node, clusterhead, network, solution){
	var stepIndex;
	//solution.createStep();
	stepIndex = solution.steps.length - 1;
	solution.steps[stepIndex].text = "Node "+node.id+" broadcasted JOIN ("+node.id+","+clusterhead.id+") and Exited.";
	node.EXIT = true;
	solution.steps[stepIndex].data["clusters"] = _returnClusters(network);
}

//Called when a node receives CH
var _receiveCH = function(node, sender, network, timestep, solution){
	var biggerWeightNeighbors = [];
	var tempNode;
	var stepIndex;
	//solution.createStep();
	stepIndex = solution.steps.length - 1;
	solution.steps[stepIndex].text = "Node "+node.id+" received CH from "+sender.id+".";
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
	solution.steps[stepIndex].data["clusters"] = _returnClusters(network);
}

//How a clusterhead handles a JOIN message
var _clusterheadHandlesJOIN = function(receiver, sender, clusterhead, smallerWeightNeighbors, network, step){
	//if  the JOIN is for me
	if(clusterhead.id == receiver.id){
		receiver.cluster.push(sender.id);
		step.text += "Clusterhead "+receiver.id+" put node "+sender.id+" to its cluster.</br>";
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
		console.log("Node "+receiver.id+" exited");
		step.text +="Clusterhead "+receiver.id+" Exited. All smaller weighted neighbors have sent JOIN."; 
	}
}

//Called when a node receives JOIN
var _receiveJOIN = function(receiver, sender, clusterhead, network, timestep, solution){
	var smallerWeightNeighbors = [];
	var tempNode;
	var conditionOR; //boolean
	var conditionJOIN; //boolean
	var stepIndex;
	//solution.createStep();
	stepIndex = solution.steps.length - 1;
	solution.steps[stepIndex].text = "Node "+receiver.id+" received JOIN ("+sender.id+","+clusterhead.id+").</br>";
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
		_clusterheadHandlesJOIN(receiver, sender, clusterhead, smallerWeightNeighbors, network, solution.steps[stepIndex]);
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
				receiver.cluster.push(receiver.id);
				receiver.clusterhead = receiver.id;
				receiver.toSend = {"type" : "CH", "timestep" : (timestep+1)};
				solution.steps[stepIndex].text += "Node "+receiver.id+" became clusterhead. All bigger weighted neighbors have sent JOIN.";
				console.log("Node "+receiver.id+" became clusterhead");
				//if those with smaller weight have sent JOIN exit
				var exit = true;
				for(var n=0; n<smallerWeightNeighbors.length; n++){
					if(!_checkIfNodeSent("JOIN", receiver, smallerWeightNeighbors[n])){
						exit = false;
						break;
					}
				}
				if(exit){
					console.log("Node "+receiver.id+" exited");
					receiver.EXIT = true;
					solution.steps[stepIndex].text += "</br>Node "+receiver.id+" Exited."; 
				}
			}
			else{ //they all sent CH or JOIN
				//choose the clusterhead with the biggest weight and JOIN him
				receiver.clusterhead = _getBiggestClusterhead(receiver.CH_messagesInbox);
				console.log("Node "+receiver.id+" will join biggest clusterhead "+receiver.clusterhead);
				receiver.toSend = {"type" : "JOIN", "receiver" : receiver.clusterhead, "timestep" : (timestep+1)};
				solution.steps[stepIndex].text += "Node "+receiver.id+" sees that all the neighbors with bigger weights have" +
				" sent either CH or JOIN. In the next step he will send JOIN to the clusterhead neighbor with the biggest weight, which is "
				+receiver.clusterhead+
				" .";
			}
		}
	}
	solution.steps[stepIndex].data["clusters"] = _returnClusters(network);
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
var _procedureInit = function(network, solution){
	var greaterWeight;
	var receiveQueue = [];
	var neighbors = [];
	solution.text ="Timestep 1.<br/>Beginning with \"Procedure Init\" of the DCA Algorithm.</br>\
	In this step only the nodes with the highest weight in their neighborhood send CH.";
	solution.createStep();
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
			_sendCH(network.nodes[i], network, solution);
			console.log("Node " +network.nodes[i].id+"sends CH");
			for(var k=0; k<neighbors.length; k++){
				receiveQueue.push({"nodeToCall" : neighbors[k], "sender" : network.nodes[i]});
			}
		}
	}
	//Now call the receive methods
	for(var i=0; i<receiveQueue.length; i++){
		console.log("Node "+ receiveQueue[i]["nodeToCall"].id + " received CH from "+ receiveQueue[i]["sender"].id);
		_receiveCH(receiveQueue[i]["nodeToCall"], receiveQueue[i]["sender"], network, 1, solution);
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
var _stepSimulator = function(network, solution){
	var node;
	var neighbors;
	var timestep = 2;
	var receiveQueue = [];	//In an execution step receiving a message happens at the end, after sending all messages pending so far. 
							//So we use a queue to track which receive functions to call after all nodes have sent their messages.
	while((!_haveAllExited(network)) &&(timestep<100)){
	//	solution.createStep();
		solution.steps[solution.steps.length - 1].text = "Timestep "+timestep+".</br>";
		console.log("Timestep "+timestep+" ================");
		//solution.steps[solution.steps.length - 1].data = {"clusters" : solution.steps[solution.steps.length - 2].data.clusters.slice()};
		receiveQueue = [];
		//First send all pending messages for this step
		for(var i=0; i<network.nodes.length; i++){
			node = network.nodes[i];
			if(!node.EXIT){
				if(node.toSend["type"] != null){
					neighbors = netOperator.returnNeighborObjects(node, network);
					if((node.toSend["type"] == "CH") && (node.toSend["timestep"] == timestep)){
						_sendCH(node, network, solution);
						console.log("Node " +node.id+" sends CH");
						for(var j=0; j<neighbors.length; j++){
							receiveQueue.push({"type" : "CH", "nodeToCall" : neighbors[j], "sender" : node});
						}
						node.toSend = {};
					}
					else if((node.toSend["type"] == "JOIN") && (node.toSend["timestep"] == timestep)){
						_sendJOIN(node, netOperator.returnNodeById(node.toSend["receiver"], network), network, solution);
						console.log("Node " +node.id+" sends JOIN to "+node.toSend["receiver"]);
						console.log("Node "+node.id+" exited");
						for(var j=0; j<neighbors.length; j++){
							receiveQueue.push({"type" : "JOIN", "nodeToCall" : neighbors[j], "sender" : node, 
								"receiver" : netOperator.returnNodeById(node.toSend["receiver"], network)});
						}
						node.toSend = {};
					}
				}
			}
		}
		//Now execute the receiving functions
		for(var i=0; i<receiveQueue.length; i++){
			if((receiveQueue[i]["type"] == "CH") && (receiveQueue[i]["nodeToCall"].EXIT == false)){
				console.log("Node "+receiveQueue[i]["nodeToCall"].id+" receives CH from "+receiveQueue[i]["sender"].id);
				_receiveCH(receiveQueue[i]["nodeToCall"], receiveQueue[i]["sender"], network, timestep, solution);
			}
			else if((receiveQueue[i]["type"] == "JOIN") && (receiveQueue[i]["nodeToCall"].EXIT == false)){
				console.log("Node "+receiveQueue[i]["nodeToCall"].id+" receives JOIN ("+receiveQueue[i]["sender"].id+","+receiveQueue[i]["receiver"].id+")");
				_receiveJOIN(receiveQueue[i]["nodeToCall"], receiveQueue[i]["sender"], receiveQueue[i]["receiver"], network, timestep, solution);
			}
		}
		timestep ++;
	}
	console.log("Exited while");
}

var _returnClusters = function(network){
	var clusters = [];
	var newCluster;
	for(var i=0; i<network.nodes.length; i++){
		if(network.nodes[i].id == network.nodes[i].clusterhead){
			newCluster = new Cluster();
			newCluster.clusterhead = network.nodes[i].clusterhead;
			newCluster.group = network.nodes[i].cluster.slice();
			clusters.push(newCluster);
		}
	}
	return clusters;
}

module.exports.dcaFactory = dcaFactory;
