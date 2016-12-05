/*
This module implements the LMST algorithm
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");
var pathfinder = require("./pathfinding").newPathfinding;

//Object Factory
var lmstFactory = function(){
    return new lmstObject();
} 

//Main Object
var lmstObject = function(){
    var that = this;
    var solution = {

    };
    var constructLMST = function(network){
        var edges = _returnEdgesPerNode(network);
    }
}

//Returns the edges of the network and their assosiated distance
var _returnEdgesPerNode = function(network){
    var edges = [];
    var distance;
    var x_diff;
    var y_diff;
    var neighbor;
    for(var i=0; i<network.nodes.length; i++){
        edges.push([]);
        for(var j=0; j<network.nodes[i].neighbors.length; j++){
            neighbor = netOperator.returnNodeById(network.nodes[i].neighbors[j]);
            x_diff = network.nodes[i].graphic.attributes.position.x - neighbor.graphic.attributes.position.x;
            y_diff = network.nodes[i].graphic.attributes.position.y - neighbor.graphic.attributes.position.y;
            distance = Math.sqrt( Math.pow(x_diff, 2)+Math.pow(y_diff, 2));
            edges[i].push({"source" : network.nodes[i].id, "target" : neighbor.id, "distance" : distance});
        }
    }
    return edges;
}

//A node Object
var Node = function (){
	this.id = 0;
	this.neighbors = [];
    this.graphic = {};
}

//Returns the subnetwork of a node + its 1-hop neighbors and their connections with each other
var _returnSubnetwork = function(node, network){
    var subnetwork = { nodes : [node]};
    var newNode;
    var neighbor;
    for(var i=0; i<node.neighbors.length; i++){
        neighbor = netOperator.returnNodeById(node.neighbors[i], network);
        newNode = new Node();
        newNode.id = neighbor.id;
        newNode.graphic = neighbor.graphic;
        newNode.neighbors = _.intersection(node.neighbors, neighbor.neighbors);
        subnetwork.nodes.push(newNode);
    }
    return subnetwork;
}

//Excute Prim's Algorithm on the given subnetwork
var _executePrim = function(start, end, subnetwork){

}

module.exports.newLMST = lmstFactory;