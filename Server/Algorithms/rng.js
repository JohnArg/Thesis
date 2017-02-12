/*
This module will handle the RNG algorithm implementation
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

var rngFactory = function(){
    return new rngObject;
}

var rngObject = function(){
    var that = this;
    that.solution = {
        "RNG" : [],
        "step_data" : solutionFactory.newSolution()
    };
    that.constructRNG = function(network){
        for(var i=0; i<network.nodes.length; i++){
            that.solution["RNG"].push(_calculateLocalRNG(network.nodes[i], network, that.solution["step_data"]));
        }
        return that.solution;
    };
}

var _calculateLocalRNG = function(node, network, solution){
    var neighbors;
    var distances = []; //distance from node to each neighbor
    var distance;
    var x_diff;
    var y_diff;
    neighbors = netOperator.returnNeighborObjects(node, network);
    solution.createStep();
    solution.steps[solution.steps.length - 1].text = "<p class=\"colored-text2\">Current node "+node.id+".</p><ul>";
    //First calculate the distances of node from all its neighbors
    for(var i=0; i<neighbors.length; i++){
        x_diff = node.position.x - neighbors[i].position.x;
        y_diff = node.position.y - neighbors[i].position.y;
        distance = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(y_diff, 2));
        distances.push(distance);
    }
    //Then for each neighbor check if their link with the node should be in the RNG.
    var edges = [];
    var valid;
    for(var i=0; i<neighbors.length; i++){
        valid = true;
        for(var j=0; j<neighbors.length; j++){  //is there any other neighbor inside the intersection of the 2 nodes' circles?
            if((i != j) && (_.indexOf(neighbors[i].neighbors, neighbors[j].id) != -1)){
                x_diff = neighbors[i].position.x - neighbors[j].position.x;
                y_diff = neighbors[i].position.y - neighbors[j].position.y;
                distance = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(y_diff, 2)); //distance between the 2 neighbors
                if((distances[j] < distances[i]) && (distance < distances[i])){
                    valid = false;
                    solution.steps[solution.steps.length - 1].text += "<li>Edge between "+node.id+" and "+neighbors[i].id+
                    " with distance "+distances[i]+" omitted because of neighbor node "+neighbors[j].id+" between them.\
                    Edge ["+node.id+","+neighbors[j].id+"] has a distance of "+distances[j]+", \
                    while Edge ["+neighbors[i].id+","+neighbors[j].id+"] has a distance of "+distance+".</li>";
                    break;
                }
            }
        }
        if(valid){
            edges.push( {"source" : node.id, "target" : neighbors[i].id });
            solution.steps[solution.steps.length - 1].text += "<li>Selected edge ["+node.id+" , "+neighbors[i].id+"] with distance "
            +distances[i]+".</li>";
        }
    }
    solution.steps[solution.steps.length - 1].text += "</ul>";
    return edges;
}

module.exports.newRNG = rngFactory;