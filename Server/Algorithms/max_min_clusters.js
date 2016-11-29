/*
This module will handle the execution of the Max-Mix D-Cluster algorithm.
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

//Object factory
var MaxMinFactory = function(){
    return new MaxMinClusters();
}

//Main Object To Be Returned
var MaxMinClusters = function(){
    var that = this;
    that.solution = {
        "floodmax" : [],
        "floodmin" : [],
        "clusters" : [],
        "extra_notes" : ""
    };
    that.calculateMaxMixClusters = function(network, d){
        //the d value is assosiated with the hops in the algorithm
        _convertToMaxMinNodes(network);
        _roundSimulator(network , d);
        _finalWinners(network, d, solution);
        _constructSolution(network, solution);
        return that.solution;
    };
}

//Adds data to network nodes
var _convertToMaxMinNodes = function(network){
    for(var i=0; i<network.nodes.length; i++){
        network.nodes[i].floodmax = [];
        network.nodes[i].floodmin = [];
        network.nodes[i].received = [];
        network.nodes[i].finalWinner = {};
    }
}

//Clears the received list of each node
var _clearReceiveList = function(network){
    for(var i=0; i<network.nodes.lenth; i++){
        network.nodes[i].received = [];
    }
}

//Broadcast winner node simulation
var _broadcastWinner = function(sender, winner_id, network){
    var tempNode;
    for(var i=0; i<sender.neighbors.length; i++){
        tempNode = netOperator.returnNodeById(sender.neighbors[i]);
        tempNode.received.push({"sender" : sender.id, "winner" : winner_id});
    }
}

//Evaluate winner
var _evaluateWinner = function(node, floodType){
    //find the max "winner"
    if(floodType == "max"){
        var max = node.received[0];
        for(var j=1; j<node.received.length; j++){
            if(node.received[j]["winner"] > max["winner"]){
                max = node.received[j];
            }
        }
        node.floodmax.push(max);
    }
    else{
        var min = node.received[0];
        for(var j=1; j<node.received.length; j++){
            if(node.received[j]["winner"] < min["winner"]){
                min = node.received[j];
            }
        }
        node.floodmin.push(min);
    }
    node.received = [];
}

//Initial procedure
var _procedureInit = function(network){
    for(var i=0; i<network.nodes.length; i++){
        _broadcastWinner(network.nodes[i], network.nodes[i].id, network);
    }
    for(var i=0; i<network.nodes.length; i++){
        _evaluateWinner(network.nodes[i], "max");
    }
}

//Round simulator
var _roundSimulator = function(network , d){
    //floodmax
    for(var j=0; j<d; j++){
        if(j == 0){
            _procedureInit(network);
        }
        else{
            for(var i=0; i<network.nodes.length; i++){
                //broadcast previous round winner
                _broadcastWinner(network.nodes[i], network.nodes[i].floodmax[j-1]["winner"], network);
            }
            for(var i=0; i<network.nodes.length; i++){
                _evaluateWinner(network.nodes[i], "max");
            }
        }
    }
    //floodmin
    for(var j=0; j<d; j++){
        if(j == 0){
            for(var i=0; i<network.nodes.length; i++){
                //broadcast previous round winner
                _broadcastWinner(network.nodes[i], network.nodes[i].floodmax[d-1]["winner"], network);
            }
            for(var i=0; i<network.nodes.length; i++){
                _evaluateWinner(network.nodes[i], "min");
            }
        }
        else{
            for(var i=0; i<network.nodes.length; i++){
                _broadcastWinner(network.nodes[i], network.nodes[i].floodmin[j-1]["winner"], network);
            }
            for(var i=0; i<network.nodes.length; i++){
                _evaluateWinner(network.nodes[i], "min");
            }
        }
    }
}

//Return the intersection of floodmax and floodmin
var _returnFloodIntersection = function(node){
    intersect = [];
    for( var i=0; i< node.floodmax.length; i++){
        for(var j=0; j<node.floodmin.length; j++){
            if(node.floodmax[i]["winner"] == node.floodmin[j]["winner"]){
                intersect.push(node.floodmax[i]);
            }
        }
    }
    return intersect;
}

//Returns the senders of the winner id from the node pairs
var _returnWinnerSenders = function(comparisonType, nodePairs){
    var senders = [];
    for(var i=0; i<nodePairs.length; i++){

    }
}

//Will decide the final winners of the execution
var _finalWinners = function(network, d, solution){
    //Use rule 1,2 and 3 to define th winners 
    for(var i=0; i<network.nodes[i].length; i++){
        //if i have my id as winner in floodmin end
        if(network.nodes[i].id == network.nodes[i].floodmin[d-1]["winner"]){
            network.nodes[i].finalWinner = network.nodes[i].floodmin[d-1];
        }
        else{
            var nodePairs = _returnFloodIntersection(network.nodes[i]);
            if(nodePairs.length > 0){
                network.nodes[i].finalWinner = _.min(nodePairs, function(elem){return elem["winner"];});
            }
            else{
                network.nodes[i].finalWinner = _.max(network.nodes[i].floodmax, function(elem){return elem["winner"];});
            }
        }
    }
    //Nodes will send their id to the cluster they selected. If another cluster is found in the path
    //then the sender node must change his previous clusterhead to this one. Below we simulate this behaviour.

}

//Put the results to the solution object
var _constructSolution = function(solution){

}

module.exports.newMaxMinObject = MaxMinFactory;