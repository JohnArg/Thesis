/*
This module implements the Maximal Independent Set algorithm
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

//Object Factory
var misFactory = function(){
    return new misObject();
} 

var misObject = function(){
    that = this;
    that.solution = {
        "edges" : [],
        "levels" : solutionFactory.newSolution(),
        "colors" : solutionFactory.newSolution(),
        "cds" : solutionFactory.newSolution()
    };
    that.constructMIS = function(network, rootNode){
         var index = netOperator.returnNodeIndexById(rootNode, network); //get the index of the root inside the network.nodes array
        _convertToMisNodes(index, network);    //add the appropriate properties to the network nodes  
        that.solution["edges"] = _constructRootedTree(index, network); //the network object is transformed to a rooted tree
        return that.solution;
    };
}

//Add more properties to the network nodes
var _convertToMisNodes = function(rootIndex, network){
    //Then add extra properties
    for(var i=0; i<network.nodes.length; i++){
        if(i == rootIndex){
            network.nodes[i].root = true;
             network.nodes[i].parent = network.nodes[i].id;
        }
        else{
            network.nodes[i].root = false;
             network.nodes[i].parent = -1;
        }
        network.nodes[i].children = [];
        network.nodes[i].level = -1;
        network.nodes[i].nonLeveledNeighbors = network.nodes[i].neighbors;
        network.nodes[i].childrenNotComplete = 0;
        network.nodes[i].levelList = [];
        network.nodes[i].lowerRankedNeighbors = 0;
        network.nodes[i].toSend = []; //list of texts indicating what message should the node send in the next step
    }
}

//Every node must have parent/children - use of the PIF algorithm (see references in README)
var _constructRootedTree = function(rootIndex, network){
    var edges = []; //Will be used for visually representing the tree
    var toBroadcastList = []; //It will hold which nodes will broadcast next
    //First the root sends to all its neighbors
    console.log("Parent ", network.nodes[rootIndex].id);
    var neighbors = netOperator.returnNeighborObjects(network.nodes[rootIndex], network);
    for(var i=0; i<neighbors.length; i++){
        neighbors[i].parent = network.nodes[rootIndex].id;
        network.nodes[rootIndex].children.push(neighbors[i].id);
        network.nodes[rootIndex].childrenNotComplete ++;
        toBroadcastList.push(neighbors[i]);
        edges.push({"source" : network.nodes[rootIndex].id, "target" : neighbors[i].id});
    }   
    console.log("Children ", network.nodes[rootIndex].children);
    //Then the rest of the nodes broadcast
    var newBcastList = [];
    while(toBroadcastList.length > 0){
        newBcastList = toBroadcastList.slice();
        for(var i=0; i<toBroadcastList.length; i++){
            console.log("Parent ", toBroadcastList[i].id);
            neighbors = netOperator.returnNeighborObjects(toBroadcastList[i], network);
            for(var j=0; j<neighbors.length; j++){
                if(neighbors[j].parent == -1){  //if this neighbor doesn't have a parent already
                    neighbors[j].parent = toBroadcastList[i].id;
                    toBroadcastList[i].children.push(neighbors[j].id);
                    toBroadcastList[i].childrenNotComplete ++;
                    newBcastList.push(neighbors[j]);
                    edges.push({"source" : toBroadcastList[i].id, "target" : neighbors[j].id});
                }
            }  
            newBcastList = newBcastList.filter(function(el){ //after finishing remove the node from the Broadcast List
                return el.id != toBroadcastList[i].id;
            });
            console.log("Children ", toBroadcastList[i].children);
        }
        toBroadcastList = newBcastList.slice();
    }
    return edges;
}

//Returns the children objects of the node
var _returnChildrenObjects = function(node, network){
    var childrenObjs = [];
    for(var i=0; i<node.children.length; i++){
        childrenObjs.push(netOperator.returnNodeById(node.children[i], network));
    }
    return childrenObjs;
}

//Calculates the lower ranked neighbors
var _lowerRankedNeighbors = function(node){
    node.lowerRankedNeighbors=0;
    for(var i=0; i<node.levelList.length; i++){
        if((levelList[i].level > node.level) || ((levelList[i].level == node.level) && (levelList[i].sender > node.id)) ){
            node.lowerRankedNeighbors++;
        }
    }
}

//Send LEVEL message
var _sendLEVEL = function(node, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length -1].text = "<p>Node "+node.id+" with level "+node.level+" broadcasts LEVEL message.</p>";
    var neighbors = netOperator.returnNeighborObjects(node, network);
    for(var i=0; i<neighbors.length; i++){
        _onReceiveLEVEL(neighbors[i], node.id, node.level, solution);
    }
    node.toSend = node.toSend.filter(function(el){ //remove the LEVEL message from the queue
        return el != "level";
    });
}

//Receining a LEVEL message
var _onReceiveLEVEL= function(node, sender_id, sender_level, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received LEVEL message from "+sender_id+".</p>";
    if(sender_id == node.parent){
        node.level = sender_level+1;
        node.toSend.push("level");
        if(node.children.length == 0){  //i'm a leaf and now i know my level
            node.toSend.push("levelComplete");
        }
        solution.steps[solution.steps.length-1].text += "<p>Node "+node.id+" set its level as "+node.level+".</p>";
    }
    node.levelList.push({ sender : sender_id, level : sender_level});
    node.nonLeveledNeighbors --;
    if(node.nonLeveledNeighbors == 0){
        node.lowerRankedNeighbors = _lowerRankedNeighbors(node);
    }
}

//Send a LEVEL complete message
var _send_LEVEL_COMPLETE = function(node, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" sends LEVEL COMPLETE message to parent "+node.parent+".</p>";
    var parent = netOperator.returnNodeById(node.parent, network);
    _onReceive_LEVEL_COMPLETE(parent, sender_id, solution);
}

//Receive a LEVEL complete message
var _onReceive_LEVEL_COMPLETE = function(node, sender_id, solution){

}

//Assign levels as the MIS algorithm instructs
var _levelMarking = function(rootIndex, network, solution){
    solution.text = "<p>First we begin with the Level Marking process. Given the rooted spanning tree, the root broadcasts a LEVEL message first"+
    " and the process continues until all nodes have calculated their own levels.</p>";
    //root sends LEVEL message to the children first
    
    //then the rest of the nodes boradcast a LEVEL message
}

module.exports.newMIS = misFactory;