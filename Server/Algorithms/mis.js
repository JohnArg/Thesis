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
        _beginMessaging(index, network, that.solution);
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
            network.nodes[i].level = 0;
        }
        else{
            network.nodes[i].root = false;
            network.nodes[i].parent = -1;
            network.nodes[i].level = -1;
        }
        network.nodes[i].children = [];
        network.nodes[i].nonLeveledNeighbors = network.nodes[i].neighbors.length;
        network.nodes[i].childrenNotComplete = 0;
        network.nodes[i].levelList = [];
        network.nodes[i].lowerRankedNeighbors = 0;
        network.nodes[i].toSend = []; //list of texts indicating what message should the node send in the next step
        network.nodes[i].blackList = []; //list of black neighbor's ids
        network.nodes[i].color = "white";
    }
    //Also add some properties to the network object used later in the solutions 
    //(since the network object is a parameter in most functions, there is no need to add a new object holding these booleans)
    network.beginColorMarking = false;
    network.beginCDS =false;
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

//Calculates the lower ranked neighbors - lexicographic order (level, id). Smaller = lower rank
var _lowerRankedNeighbors = function(node){
    node.lowerRankedNeighbors=0;
    for(var i=0; i<node.levelList.length; i++){
        if((node.levelList[i].level < node.level) || ((node.levelList[i].level == node.level) && (node.levelList[i].sender < node.id)) ){
            node.lowerRankedNeighbors++;
        }
    }
}

//Broadcast a message
var _sendMessage = function(type, node, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length -1].text = "<p>Node "+node.id+" with level "+node.level+" broadcasts "
    var neighbors = netOperator.returnNeighborObjects(node, network);
    switch(type){
        case "level" :
            solution.steps[solution.steps.length -1].text += "LEVEL message.</p>";
            for(var i=0; i<neighbors.length; i++){
                _onReceiveLEVEL(neighbors[i], node.id, node.level, solution);
            }
            node.toSend = node.toSend.filter(function(el){ //remove the LEVEL message from the queue
                return el != "level";
            });
            break;
        case "levelComplete":
            solution.steps[solution.steps.length -1].text += "LEVEL COMPLETE message to parent "+node.parent+".</p>";
            node.toSend = node.toSend.filter(function(el){ //remove the LEVEL message from the queue
                return el != "levelComplete";
            });
            var parent = netOperator.returnNodeById(node.parent, network);
            _onReceive_LEVEL_COMPLETE(parent, node.id, network, solution);
            break;
        case "black":
            solution.steps[solution.steps.length -1].text += "BLACK message.</p>";
            if(node.root){
                solution.steps[solution.steps.length -1].data["colors"] = _returnColorArray(network);
            }
            for(var i=0; i<neighbors.length; i++){
                _onReceiveBLACK(neighbors[i], node.id, network, solution);
            }
            node.toSend = node.toSend.filter(function(el){ //remove the LEVEL message from the queue
                return el != "black";
            });
            break;
        case "gray":
            solution.steps[solution.steps.length -1].text += "GRAY message.</p>";
            for(var i=0; i<neighbors.length; i++){
                _onReceiveGRAY(neighbors[i], node.id, node.level, network, solution);
            }
            node.toSend = node.toSend.filter(function(el){ //remove the LEVEL message from the queue
                return el != "gray";
            });
            break;
        case "markComplete":
            solution.steps[solution.steps.length -1].text += "MARK COMPLETE message to parent "+node.parent+".</p>";
            node.toSend = node.toSend.filter(function(el){ //remove the LEVEL message from the queue
                return el != "markComplete";
            });
            var parent = netOperator.returnNodeById(node.parent, network);
            _onReceive_MARK_COMPLETE(parent, node.id, network, solution);
            break;
    }
    return true;
}

//Receiving a LEVEL message
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
        _lowerRankedNeighbors(node);
        solution.steps[solution.steps.length-1].text += "<p>Node "+node.id+" has heard LEVEL from all the neighbors."+
        " The number of lower ranked neighbors is "+node.lowerRankedNeighbors+"</p>";
    }
}

//Receive a LEVEL complete message
var _onReceive_LEVEL_COMPLETE = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received LEVEL_COMPLETE message from "+sender_id+".</p>";
    node.childrenNotComplete --;
    if(node.childrenNotComplete == 0){
        if(!node.root){
            solution.steps[solution.steps.length-1].text += "<p>The node has received LEVEL_COMPLETE from all children.</p>";
            node.toSend.push("levelComplete");
        }
        else{
            solution.steps[solution.steps.length-1].text += "<p>The root has received LEVEL_COMPLETE from all children.</p>";
            network.beginColorMarking = true; //as a signal to begin the next marking process
        }
        node.childrenNotComplete = node.children.length;
    }
}

//Returns an array with a color value for each network node. Used only in the data stored in steps
var _returnColorArray = function(network){
    var colorArray =[];
    for(var i=0; i<network.nodes.length; i++){
        colorArray.push(network.nodes[i].color);
    }
    return colorArray;
}

//Receive a BLACK message
var _onReceiveBLACK = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received BLACK message from "+sender_id+".</p>";
    if(node.blackList.length < 6){  //the algorithm says the blacklist must have at most 5 nodes
        node.blackList.push(sender_id);
        if(node.color == "white"){
            node.color = "gray";
            solution.steps[solution.steps.length-1].text += "<p>The node changed its color to GRAY.</p>";
            solution.steps[solution.steps.length-1].data["colors"] = _returnColorArray(network);
            node.toSend.push("gray");
            if(node.children.length == 0){ //leaf
                node.toSend.push("markComplete");
            }
        }
    }
}

//Receive a GRAY message
var _onReceiveGRAY = function(node, sender_id, sender_level, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received GRAY message from "+sender_id+".</p>";
    if((node.level > sender_level) || ((node.level == sender_level)&&( node.id > sender_id))){ //if i received from a lower ranked neighbor
        if(node.color == "white"){
            node.lowerRankedNeighbors --;
            if(node.lowerRankedNeighbors == 0){
                node.color = "black";
                solution.steps[solution.steps.length-1].text += "<p>The node changed its color to BLACK.</p>";
                solution.steps[solution.steps.length-1].data["colors"] = _returnColorArray(network);
                node.toSend.push("black");
                if(node.children.length == 0){ //leaf
                    node.toSend.push("markComplete");
                }
            }
        }
    }
}

//Receive a MARK COMPLETE message
var _onReceive_MARK_COMPLETE = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received MARK COMPLETE message from "+sender_id+".</p>";
    node.childrenNotComplete --;
    if(node.childrenNotComplete == 0){
        if(!node.root){
            node.toSend.push("markComplete");
            solution.steps[solution.steps.length-1].text += "<p>The node got MARK COMPLETE from all children. It can brodcast MARK COMPLETE now.</p>";
        }
        else{
            network.beginCDS = true;
            solution.steps[solution.steps.length-1].text += "<p>The root got MARK COMPLETE from all children. The color marking process finished.</p>";
        }
    }
}

//Run the algorithm by sending messages 
var _beginMessaging = function(rootIndex, network, solution){
    //Level Marking process ==========================================
    solution["levels"].text = "<p class=\"solution-heading\">First we begin with the Level Marking process. Given the rooted spanning tree, the root broadcasts a LEVEL message first"+
    " and the process continues until all nodes have calculated their own levels.</p>";
    //root sends LEVEL message to the children first
    var rootNode = network.nodes[rootIndex];
    _sendMessage("level", rootNode, network, solution["levels"]);
    //then the rest of the nodes broadcast a LEVEL message
    var messageList = [];
    while(!network.beginColorMarking){
        for(var i=0; i<network.nodes.length; i++){
            messageList = network.nodes[i].toSend.slice(); // hold the original queue (it changes after sending message)
            for(var j=0; j<messageList.length; j++){
                switch(messageList[j]){
                    case "level": 
                        _sendMessage("level", network.nodes[i], network, solution["levels"]); 
                        break;
                    case "levelComplete": 
                        _sendMessage("levelComplete", network.nodes[i], network, solution["levels"]); 
                        break;
                    default : break;
                }
            }
        }
    }
    //Color marking process ===========================================
    solution["colors"].text = "<p class=\"solution-heading\">Now we continue with the color marking process. All nodes are initially marked with white color and will be marked with either"+
    " gray or black eventually.</p>";
    rootNode.color = "black";
    _sendMessage("black", rootNode, network, solution["colors"]);
    while(!network.beginCDS){
        for(var i=0; i<network.nodes.length; i++){
            messageList = network.nodes[i].toSend.slice(); // hold the original queue (it changes after sending message)
            for(var j=0; j<messageList.length; j++){
                switch(messageList[j]){
                    case "black": 
                        _sendMessage("black", network.nodes[i], network, solution["colors"]); 
                        break;
                    case "gray": 
                        _sendMessage("gray", network.nodes[i], network, solution["colors"]); 
                        break;
                    case "markComplete":
                        _sendMessage("markComplete", network.nodes[i], network, solution["colors"]); 
                        break;
                    default : break;
                }
            }
        }
    }
    console.log("Ended color marking");
    //keep the colors of the nodes at their current state as the final result of this process
    solution["colors"].data = _returnColorArray(network);
}

module.exports.newMIS = misFactory;