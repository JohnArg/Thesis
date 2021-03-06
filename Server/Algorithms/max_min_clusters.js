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
        "clusters" : [], //will have the clusters formed after floodmax/floodmin
        "clusters2" : [], //will have the clusters formed after the messaging process
        "messages_solution" : solutionFactory.newSolution(),
        "extra_notes" : "",

    };
    that.calculateMaxMixClusters = function(network, d){
        //the d value is assosiated with the hops in the algorithm
        _convertToMaxMinNodes(network);
        _roundSimulator(network , d);
        _finalWinners(network, d, that.solution);
        _constructSolution(network, that.solution, d);
        _clustersAfterMessaging(network, that.solution, d);
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
    var index=-1;
    for(var i=0; i<solution["clusters"].length; i++){
        if(solution["clusters"][i]["clusterhead"] == node.finalWinner["winner"]){
            index = i;
            break;
        }
    }
    if(index == -1){ //cluster not found - create a record
        if(node.id == node.finalWinner["winner"]){  //if i am a clusterhead
            solution["clusters"].push({"clusterhead" : node.finalWinner["winner"], "group" : [node.id]});
        }
        else{ //if somebody else is my clusterhead
            solution["clusters"].push({"clusterhead" : node.finalWinner["winner"], "group" : [node.finalWinner["winner"],node.id]});
        }    
    }
    else{ //the cluster exists
        if(node.id != solution["clusters"][index]["clusterhead"]){  //if i am not the clusterhead
            solution["clusters"][index]["group"].push(node.id);
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
    var intersect = [];
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
            if(list[i]["winner"] > result["winner"]){
                result = list[i];
            }
        }
        else{
            if(list[i]["winner"] < result["winner"]){
                result = list[i];
            }
        }
    }
    return result;
}

//Finds a node id in a floodlist
var _isNodeInFloodList = function(id, floodList){
    for(var i=0; i<floodList.length; i++){
        if(floodList[i]["winner"] == id){
            return i;
        }
    }
    return -1;
}

//Will decide the final winners of the execution
var _finalWinners = function(network, d, solution){
    //Use rule 1,2 and 3 to define th winners 
    for(var i=0; i<network.nodes.length; i++){
        //Rule 1 : I received my id in floodmin, so i become clusterhead
        let index = _isNodeInFloodList(network.nodes[i].id, network.nodes[i].floodmin);
        if( index != -1){
            network.nodes[i].finalWinner = network.nodes[i].floodmin[index];
        }
        else{//Rule 2 select minimum node pair if it exists
            var nodePairs = _returnFloodIntersection(network.nodes[i]);
            if(nodePairs.length > 0){
                network.nodes[i].finalWinner = _returnListWinner("min", nodePairs);
            }
            else{ //No node pairs exist, select maximum id in floodmax
                network.nodes[i].finalWinner = _returnListWinner("max", network.nodes[i].floodmax);
            }
        }
    }
}

//Retrieves a copy of an object list containing clusters
var _deepCopyClusters = function(clusters){
    var newClusters = [];
    for(var i=0; i<clusters.length; i++){
        newClusters.push({clusterhead : clusters[i].clusterhead, group : clusters[i].group.slice()});
    }
    return newClusters;
}
//Used by the _clustersAfterMessaging only.
var _joinClusterhead = function(joiner, clusterhead, solution){
    for(var i=0; i<solution.clusters2.length; i++){
        if(solution.clusters2[i].clusterhead == clusterhead){
            solution.clusters2[i].group.push(joiner);
            break;
        }
    }
}

/*
After the floodmax and floodmin stages, the clusterheads broadcast a message to notify the other nodes to join their cluster.
These messages are rebroadcasted by the receiving nodes, for a maximum of d-hops away from the clusterhead. The receiving nodes also 
choose as clusterhead, the one whose message reached them first. This process replaces the 
convergecast solution originally proposed, because the latter leads to infinite loops in some occassions.
The following function implements the process.
*/
var _clustersAfterMessaging = function(network, solution, d){
    let toSend = []; //a list with the nodes to send and what to send
    var clusters = solution.clusters;
    var messageSol = solution.messages_solution;
    for(var i=0; i<network.nodes.length; i++){
        network.nodes[i].message = { sender : -1, hop : -1, clusterhead: -1}; //keeps the first message each node receives. Every other message is dropped
    }
    for(var i=0; i<clusters.length; i++){
        let node = netOperator.returnNodeById(clusters[i].clusterhead, network);
        node.message = { sender : 0, hop : 0, clusterhead : node.id};
        toSend.push(node.id); //the clusterheads will begin broadcasting
        solution.clusters2.push({clusterhead : node.id, group:[node.id]});
    }
    while(toSend.length > 0){
        let toSendNew = [];
        for(var i=0; i<toSend.length; i++){
            let node = netOperator.returnNodeById(toSend[i], network);
            if(node.message.hop < d){ //broadcast only if the message doesn't reach beyond the d-hops
                messageSol.createStep();
                messageSol.steps[messageSol.steps.length - 1].text = "Node "+node.id+" broadcasts a 'Join Clusterhead's "+node.message.clusterhead+" Cluster' message.";
                messageSol.steps[messageSol.steps.length - 1].data = _deepCopyClusters(solution.clusters2);
                for( var j=0; j<node.neighbors.length; j++){ //broadcast to the neighbors 
                    let neighID = node.neighbors[j];
                    let neighbor = netOperator.returnNodeById(neighID, network);
                    if(neighbor.message.sender == -1){ //nobody sent me a message so far
                        neighbor.message = {sender : node.id, hop : node.message.hop+1, clusterhead : node.message.clusterhead};
                        toSendNew.push(neighID);    //he has to broadcast on the next round       
                        _joinClusterhead(neighID, node.message.clusterhead, solution);   //and join the cluster by the way
                        messageSol.createStep();
                        messageSol.steps[messageSol.steps.length - 1].text = "Node "+neighID+" accepts and joins Clusterhead "+node.message.clusterhead+".";
                        messageSol.steps[messageSol.steps.length - 1].data = _deepCopyClusters(solution.clusters2);
                    }
                }
            }
        }
        toSend = toSendNew;
    }
}

module.exports.newMaxMinObject = MaxMinFactory;