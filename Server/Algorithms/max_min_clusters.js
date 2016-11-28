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
        "final_resutls" : [],
        "floodmax" : {},
        "floodmin" : {}
    };
    that.calculateMaxMixClusters = function(network, d){
        //the d value is assosiated with the hops in the algorithm
        _convertToMaxMinNodes(network);
    };
}

//Adds data to network nodes
var _convertToMaxMinNodes = function(network){
    for(var i=0; i<network.nodes.length; i++){
        network.nodes[i].winner = 0;
        network.nodes[i].floodmax = [];
        network.nodes[i].floodmin = [];
        network.nodes[i].received = [];
    }
}

//Clears the received list of each node
var _clearReceiveList = function(network){
    for(var i=0; i<network.nodes.lenth; i++){
        network.nodes[i].received = [];
    }
}

//Initial procedure
var _procedureInit = function(network){
    
}

module.exports.newMaxMinObject = MaxMinFactory;