/*
This module implements the LMST algorithm
*/
var _ = require('underscore');
var netOperator = require("./networkOperations").netOperator;
var solutionFactory = require("./steps");

//Object Factory
var lmstFactory = function(){
    return new lmstObject();
} 

//Main Object
var lmstObject = function(){
    var that = this;
    that.solution = {
        "LMSTs" : [], //list of all LMST trees
        "step_data" : solutionFactory.newSolution(),
        "uni-directional" : []
    };
    that.constructLMST = function(network){
        var subnetwork;
        var edges;
        for(var i=0; i<network.nodes.length; i++){
            that.solution["step_data"].createStep();
            that.solution["step_data"].steps[i].text = "<p class=\"colored-text2\">Current node : "+network.nodes[i].id+".</p>";
            subnetwork = _returnSubnetwork(network.nodes[i], network);
            edges = _returnEdges(subnetwork, that.solution["step_data"]);
            that.solution["LMSTs"].push(_executePrim(subnetwork, edges, that.solution["step_data"]));
        }
        that.solution["uni-directional"] = _uniDirectionalEdges(that.solution["LMSTs"]);
        return that.solution;
    };
}

//A node Object
var Node = function (){
	this.id = 0;
	this.neighbors = [];
    this.graphic = {};
    this.edges = [];    //indexes to edge objects connecting this node with the neighbors
}

//Returns the subnetwork of a node + its 1-hop neighbors and their connections with each other
var _returnSubnetwork = function(node, network){
    var subnetwork = { nodes : []};
    var newNode;
    var neighbor;
    newNode = new Node();
    newNode.id = node.id;
    newNode.position ={
        x : node.position.x,
        y : node.position.y 
    };
    newNode.neighbors = node.neighbors.slice();
    subnetwork.nodes.push(newNode);
    for(var i=0; i<node.neighbors.length; i++){
        neighbor = netOperator.returnNodeById(node.neighbors[i], network);
        newNode = new Node();
        newNode.id = neighbor.id;
        newNode.position ={
            x : neighbor.position.x,
            y : neighbor.position.y 
        };
        newNode.neighbors = _.intersection(node.neighbors, neighbor.neighbors);
        subnetwork.nodes.push(newNode);
    }
    return subnetwork;
}

//Checks if an edge already exists
var _checkIfEdgeExists = function (edge, edges){
    for(var i=0; i<edges.length; i++){
        if((edges[i]["source"] == edge["source"]) && (edges[i]["target"] == edge["target"])){
            return true;
        }  
        if((edges[i]["source"] == edge["target"]) && (edges[i]["target"] == edge["source"])){
            return true;
        }
    }
    return false;
}

//Returns the edges of the network and their assosiated distance
var _returnEdges = function(subnetwork, step_data){
    var edges = [];
    var index = 0;
    var distance;
    var x_diff;
    var y_diff;
    var neighbor;
    step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text2\">All subnetwork edges : </p><ul class=\"step-ul\">";
    for(var i=0; i<subnetwork.nodes.length; i++){
        for(var j=0; j<subnetwork.nodes[i].neighbors.length; j++){
            if(!_checkIfEdgeExists({"source" : subnetwork.nodes[i].id, "target" : subnetwork.nodes[i].neighbors[j]}, edges)){ //to avoid duplicate edges
                neighbor = netOperator.returnNodeById(subnetwork.nodes[i].neighbors[j], subnetwork);
                x_diff = subnetwork.nodes[i].position.x - neighbor.position.x;
                y_diff = subnetwork.nodes[i].position.y - neighbor.position.y;
                distance = Math.sqrt( Math.pow(x_diff, 2)+Math.pow(y_diff, 2));
                edges.push({"source" : subnetwork.nodes[i].id, "target" : neighbor.id, "distance" : distance});
                subnetwork.nodes[i].edges.push(index);
                neighbor.edges.push(index);
                step_data.steps[step_data.steps.length - 1].text += "<li>[ source : "+edges[index]["source"]+" , target : "+edges[index]["target"]
                +" , distance : "+edges[index]["distance"]+" ]</li>";
                index++;
            }
        }
    }
    step_data.steps[step_data.steps.length - 1].text += "</ul>";
    return edges;
}

//Return the edges with the minimum distance
var _minimumDistanceEdges = function(edges){
    var minDistanceEdges = [];
    var minDist = edges[0]["distance"];
    //first find the minimum distance
    for(var i=1; i<edges.length; i++){
        if(edges[i]["distance"] < minDist){
            minDist = edges[i]["distance"];
        }
    }
    //then collect the edges with the minimum distance
    for(var i=0; i<edges.length; i++){
        if(edges[i]["distance"] == minDist){
            minDistanceEdges.push(edges[i]);
        }
    }
    return minDistanceEdges;
}

//Find the maximum value of each edge's (source_id, target_id) and return all those edges with that max value
var _maxVertexIdEdges = function(edges){
    var maxIds = [];
    //calculate max(source_id, target_id) for all given edges
    for(var i=0; i<edges.length; i++){
        if(edges[i]["source"] >= edges[i]["target"]){
            maxIds.push(edges[i]["source"]);
        }
        else{
            maxIds.push(edges[i]["target"]);
        }
    }
    //find the maximum/minimum of maxIds
    var max = maxIds[0];
    for(var i=1; i<maxIds.length; i++){
        if(maxIds[i] > max){
            max = maxIds[i];
        }
    }
    //get only the edges with the maximum value from maxIds
    var maxEdges = [];
    for(var i=0; i<maxIds.length; i++){
        if(maxIds[i] == max){
             maxEdges.push(edges[i]);
        }
    }
    return maxEdges;
}

//Return the edge with the minimum vertex id 
var _minVertexIdEdges = function(edges){
    var minIds = [];
    //get the minimum vertex of each edge
    for(var i=0; i<edges.length; i++){
        if(edges[i]["source"] <= edges[i]["target"]){
            minIds.push(edges[i]["source"]);
        }
        else{
            minIds.push(edges[i]["target"]);
        }
    }
    var min = minIds[0];
    var minEdge = edges[0];
    //get only the edge with the maximum of the minimum values
    for(var i=1; i<edges.length; i++){
        if(minIds[i] > min){
            min = minIds[i];
            minEdge = edges[i];
        }
    }
    return minEdge;
}

//The function that Prim's Algorithm will use to choose the next edge
var _chooseEdgeFunction = function(edges, step_data){
    var result;
    var minDistanceEdges = _minimumDistanceEdges(edges);
    if(minDistanceEdges.length == 1){ //only one edge has the minimum distance, we can stop
        result = minDistanceEdges[0];
    }
    else{ //more than one edges have the minimum distance
        //get the ones with max(vertex id)
        step_data.steps[step_data.steps.length - 1].text += "<p>Multiple edges have the same minimum distance :</br>"+_stringifyEdgeList(minDistanceEdges)
        +"We calculate the value of max(source_id, target_id) for all of them. Then we keep the one (or those) with the maximum such value.</p>";
        var maxEdges = _maxVertexIdEdges(minDistanceEdges);
        if(maxEdges.length == 1){   //only one edge with the maximum value, i'm done
            result = maxEdges[0];
        }
        else{   //still more than one edges have the maximum value
            //from the edges with the same max values get the one with the minimum(source_id, target_id)
            step_data.steps[step_data.steps.length - 1].text += "<p>Still more than one edges with the previous maximum value :</br>"
            +_stringifyEdgeList(maxEdges) + "Now for these ones we"+
            " calculate the minimum(source_id, target_id) and get the unique one with the maximum such value.</p>";
            result = _minVertexIdEdges(maxEdges);
        }
    }
    return result;
}

//Returns the other vertex of the edge
var _returnOtherVertex = function(vertex1, edge){
    if(edge["source"] == vertex1){
        return edge["target"];
    }
    else{
        return edge["source"];
    }
}

//Returns the new vertex added by this edge
var _returnNewVertex = function(vertices, edge){
   if(_.indexOf(vertices, edge["source"]) == -1){
       return edge["source"];
   }
   else{
       return edge["target"];
   }
}

//returns string of edges list
var _stringifyEdgeList = function(edgeList){
    var text = "<ul class=\"step-ul\">";
    for(var i=0; i<edgeList.length; i++){
        text += "<li>[ source : "+edgeList[i]["source"]+" , target : "+edgeList[i]["target"]
        +", distance : "+edgeList[i]["distance"]+" ]</li>";
    }
    text += "</ul>";
    return text;
}

//Excute Prim's Algorithm on the given subnetwork
var _executePrim = function(subnetwork, edges, step_data){
    //keep a list with all the vertices to visit except for the 1st node
    step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text2\">Prim's execution for this subnetwork : </p>";
    var verticesLeft = [];
    for(var i=1; i<subnetwork.nodes.length; i++){
        verticesLeft.push(subnetwork.nodes[i].id);
    }
    //Start from the root node
    var availableEdges = [];
    for(var i=0; i<subnetwork.nodes[0].edges.length; i++){
        availableEdges.push(edges[ subnetwork.nodes[0].edges[i] ]);
    }
    var verticesVisited = [subnetwork.nodes[0].id];
    step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text3\">Vertices visited so far : ["+verticesVisited+"]</p>";
    step_data.steps[step_data.steps.length - 1].text += "<p>Choosing edge from :</br>"+_stringifyEdgeList(availableEdges)+"</p>";
    var edgesUsed = [];
    var edgeSelected = _chooseEdgeFunction(availableEdges, step_data); //choose an edge
    step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text2\">Selected edge [ source : "+edgeSelected["source"]+" , target : "+edgeSelected["target"]
    +", distance : "+edgeSelected["distance"]+" ]</p>";
    edgesUsed.push(edgeSelected);
    var vertexVisited = _returnOtherVertex(subnetwork.nodes[0].id, edgeSelected); //keep the vertex visited following this edge
    step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text3\">New vertex added : "+vertexVisited+"</p>";
    verticesLeft = verticesLeft.filter(function(el){ //remove the visited vertex from the remaining vertices to visit
        return el != vertexVisited;
    });
    verticesVisited.push(vertexVisited); //keep an array with all the vertices visited so far
    //Keep running Prim until all vertices are visited
    var node;
    var condition1;
    var condition2;
    while((verticesLeft.length != 0)){
        availableEdges = [];
        for(var i=0; i<verticesVisited.length; i++){ //get all available edges from the vertices visited so far
            node = netOperator.returnNodeById(verticesVisited[i], subnetwork);
            for(var j=0; j<node.edges.length; j++){
                //if we haven't visited a vertex of this edge (this node is either source or target of the edge)
                condition1 = _.indexOf(verticesVisited, edges[ node.edges[j] ]["source"]) != -1;   //source visited
                condition2 = _.indexOf(verticesVisited, edges[ node.edges[j] ]["target"]) != -1;   //target visited
                if(!(condition1 && condition2)){
                    availableEdges.push(edges[node.edges[j]]);
                }
            }
        }
        step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text3\">Vertices visited so far : ["+verticesVisited+"]</p>";
        step_data.steps[step_data.steps.length - 1].text += "<p>Choosing edge from :</br>"+_stringifyEdgeList(availableEdges)+"</p>";
        var edgeSelected = _chooseEdgeFunction(availableEdges, step_data); //choose an edge
        step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text2\">Selected edge [ source : "+edgeSelected["source"]+" , target : "+edgeSelected["target"]
    +", distance : "+edgeSelected["distance"]+" ]</p>";
        edgesUsed.push(edgeSelected);
        var vertexVisited = _returnNewVertex(verticesVisited, edgeSelected); //keep the vertex visited following this edge
        step_data.steps[step_data.steps.length - 1].text += "<p class=\"colored-text3\">New vertex added : "+vertexVisited+"</p>";
        verticesLeft = verticesLeft.filter(function(el){ //remove the visited vertex from the remaining vertices to visit
            return el != vertexVisited;
        });
        verticesVisited.push(vertexVisited); 
    }
    return edgesUsed;
}

//Returns the index in LMSTs array where the node with the given id is located 
var _returnLMSTNodeIndex = function(node_id, LMSTs){
    for(var i=0; i<LMSTs.length; i++){
        if(LMSTs[i][0]["source"] == node_id){   //each row of LMST contains edges and the 1st edge's "source" contains the corresponding node id
            return i;
        }
    }
}

//Returns the unidirectional edges from the LMSTs array in the solution
var _uniDirectionalEdges = function(LMSTs){
    var result = [];
    var edge;
    var found;
    var index;
    for(var i=0; i<LMSTs.length; i++){
        for(var j=0; j<LMSTs[i].length; j++){
            index = _returnLMSTNodeIndex(LMSTs[i][j]["target"], LMSTs);
            found = _checkIfEdgeExists(LMSTs[i][j], LMSTs[index]);
            if(!found){ //it's unidirectional
                result.push([i,j]); //push the indexes to the edge inside the LMSTs array
            }
        }
    }
    return result;
}

module.exports.newLMST = lmstFactory;