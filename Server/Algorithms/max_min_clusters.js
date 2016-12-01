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
        _finalWinners(network, d, that.solution);
        _constructSolution(network, that.solution, d);
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

//Insert the node to the appropriate cluster
var _insertToCluster = function(solution, node){
    if(solution["clusters"].length > 0){     
        var found=false;   
        var index=-1;
        for(var i=0; i<solution["clusters"].length; i++){
            if(solution["clusters"][i]["clusterhead"] == node.finalWinner["winner"]){
                found = true; 
                index = i;
                break;
            }
        }
        if(!found){
            if(node.id == node.finalWinner["winner"]){  //if i am a clusterhead
                solution["clusters"].push({"clusterhead" : node.finalWinner["winner"], "group" : [node.id]});
            }
            else{ //if somebody else is my clusterhead
                solution["clusters"].push({"clusterhead" : node.finalWinner["winner"], "group" : [node.finalWinner["winner"],node.id]});
            }    
        }
        else{
            solution["clusters"][index]["group"].push(node.id);
        }
    }
    else{
        if(node.id == node.finalWinner["winner"]){  //if i am a clusterhead
            solution["clusters"].push({"clusterhead" : node.finalWinner["winner"], "group" : [node.id]});
        }
        else{ //if somebody else is my clusterhead
            solution["clusters"].push({"clusterhead" : node.finalWinner["winner"], "group" : [node.finalWinner["winner"],node.id]});
        }
    }
}

//Put the results to the solution object
var _constructSolution = function(network, solution, d){
    for(var i=0; i<network.nodes.length; i++){
        solution["floodmax"].push(network.nodes[i]["floodmax"]);
        solution["floodmin"].push(network.nodes[i]["floodmin"]);
        _insertToCluster(solution, network.nodes[i]);       
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
        tempNode = netOperator.returnNodeById(sender.neighbors[i], network);
        tempNode.received.push({"sender" : sender.id, "winner" : winner_id});
    }
}

//Evaluate winner
var _evaluateWinner = function(node, floodType){
    //find the max "winner"
    if(floodType == "max"){
        var max = node.finalWinner;
        for(var j=0; j<node.received.length; j++){
            if(node.received[j]["winner"] > max["winner"]){
                max = node.received[j];
            }
        }
        node.floodmax.push(max);
        node.finalWinner = max;
    }
    else{
        var min = node.finalWinner;
        for(var j=0; j<node.received.length; j++){
            if(node.received[j]["winner"] < min["winner"]){
                min = node.received[j];
            }
        }
        node.floodmin.push(min);
        node.finalWinner = min;
    }
    node.received = [];
}

//Initial procedure
var _procedureInit = function(network){
    for(var i=0; i<network.nodes.length; i++){
        network.nodes[i].finalWinner = {"sender" : network.nodes[i].id, "winner" : network.nodes[i].id};
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
    var winners = [];
    for( var i=0; i< node.floodmax.length; i++){
        if(_.indexOf(winners, node.floodmax[i]) == -1){ //no need to check for the already checked value
            winners.push(node.floodmax[i]["winner"]);
            for(var j=node.floodmin.length-1; j>(-1); j--){ //start from the bottom to insert only the last occurence
                if(node.floodmax[i]["winner"] == node.floodmin[j]["winner"]){
                    intersect.push(node.floodmin[j]);
                    break;
                }
            }
        }
    }
    return intersect;
}

//Returns the list's winner according to comparison type
var _returnListWinner = function(comparisonType, list){
    var result = list[0];
    for(var i=0; i<list.length; i++){
        if (comparisonType == "max"){
            if(list[i]["winner"] >= result["winner"]){
                result = list[i];
            }
        }
        else{
            if(list[i]["winner"] <= result["winner"]){
                result = list[i];
            }
        }
    }
    return result;
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
                network.nodes[i].finalWinner = _returnListWinner("min", nodePairs);
            }
            else{
                network.nodes[i].finalWinner = _returnListWinner("max", network.nodes[i].floodmax);
            }
        }
    }
}

module.exports.newMaxMinObject = MaxMinFactory;