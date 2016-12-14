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

    };
    that.constructMIS = function(network, rootNode){
         var index = netOperator.returnNodeIndexById(rootNode, network); //get the index of the root inside the network.nodes array
        _convertToMisNodes(index, network);    //add the appropriate properties to the network nodes  
        _constructRootedTree(index, network); //the network object is transformed to a rooted tree
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
        network.nodes[i].nonLeveledNeighbors = 0;
        network.nodes[i].childrenNotComplete = 0;
        network.nodes[i].levelList = [];
        network.nodes[i].lowerRankedNeighbors = 0;
    }
}

//Every node must have parent/children - use of the PIF algorithm (see references in README)
var _constructRootedTree = function(rootIndex, network){
    var toBroadcastList = []; //It will hold which nodes will broadcast next
    //First the root sends to all its neighbors
    console.log("Parent ", network.nodes[rootIndex].id);
    var neighbors = netOperator.returnNeighborObjects(network.nodes[rootIndex], network);
    for(var i=0; i<neighbors.length; i++){
        neighbors[i].parent = network.nodes[rootIndex].id;
        network.nodes[rootIndex].children.push(neighbors[i].id);
        toBroadcastList.push(neighbors[i]);
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
                    newBcastList.push(neighbors[j]);
                }
            }  
            newBcastList = newBcastList.filter(function(el){ //after finishing remove the node from the Broadcast List
                return el.id != toBroadcastList[i].id;
            });
            console.log("Children ", toBroadcastList[i].children);
        }
        toBroadcastList = newBcastList.slice();
    }
}


module.exports.newMIS = misFactory;