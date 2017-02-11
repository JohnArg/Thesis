/*
This module will handle the GG (Gabriel Graph) algorithm implementation
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

var ggFactory = function(){
    return new ggObject;
}

var ggObject = function(){
    var that = this;
    that.solution = {
        "GG" : [],
        "step_data" : solutionFactory.newSolution()
    };
    that.constructGG = function(network){
        for(var i=0; i<network.nodes.length; i++){
            that.solution["GG"].push(_calculateLocalGG(network.nodes[i], network, that.solution["step_data"]));
        }
        return that.solution;
    };
}

var _calculateLocalGG = function(node, network, solution){
    var neighbors = netOperator.returnNeighborObjects(node, network);
    var distance;
    var centers = []; //center point of the distance between node and each neighbor
    var radii = []; //radius of circle with diameter the line between node's position and a neighbor's position
    var x_diff;
    var y_diff;
    solution.createStep();
    solution.steps[solution.steps.length - 1].text = "<p class=\"colored-text2\">Current node "+node.id+".</p>";
    //First calculate the distances of node from all its neighbors
    for(var i=0; i<neighbors.length; i++){
        x_diff = node.position.x - neighbors[i].position.x;
        y_diff = node.position.y - neighbors[i].position.y;
        distance = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(y_diff, 2));
        centers.push({ x : (node.position.x - x_diff/2), y : (node.position.y - y_diff/2)});
        radii.push(distance/2);
    }
    //Now add the apropriate edges to the GG
    var edges = [];
    var valid;
    for(var i=0; i<neighbors.length; i++){
        valid = true;
        for(var j=0; j<neighbors.length; j++){
            if((i != j) && (_.indexOf(neighbors[i].neighbors, neighbors[j].id) != -1)){
                x_diff = centers[i].x - neighbors[j].position.x;
                y_diff = centers[i].y - neighbors[j].position.y;
                distance = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(y_diff, 2));
                if(distance < radii[i]){
                    valid = false;
                    solution.steps[solution.steps.length - 1].text += "<p>Edge between "+node.id+" and "+neighbors[i].id+
                    " omitted because of neighbor node "+neighbors[j].id+" between them. The cirlce area used for\
                    checking has a radius of "+radii[i]+", while the distance of "+neighbors[j].id+" from the circle's\
                    center is "+distance+".</p>";
                    break;
                }
            }
        }
        if(valid){
            edges.push( {"source" : node.id, "target" : neighbors[i].id });
            solution.steps[solution.steps.length - 1].text += "<p>Selected edge ["+node.id+" , "+neighbors[i].id+"].</p>";
        }
    }
    return edges;
}    

module.exports.newGG = ggFactory;