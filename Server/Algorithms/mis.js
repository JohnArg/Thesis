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
        "cds" : solutionFactory.newSolution(),
        "cdsRootIndex" : -1,
        "cdsRootColoringStep" : -1
    };
    that.constructMIS = function(network, rootNode){
         var index = netOperator.returnNodeIndexById(rootNode, network); //get the index of the root inside the network.nodes array
        _convertToMisNodes(index, network);    //add the appropriate properties to the network nodes  
        that.solution["edges"] = _constructRootedTree(network); //the network object is transformed to a rooted tree
        _beginMessaging(network, that.solution);
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
            network.nodes[i].cdsRoot = -1;  //the id of the root in the CDS
            network.nodes[i].cdsDegree = 0; //the number of black neighbors of the CDS root
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
        network.nodes[i].blackList = []; //list of black neighbor's ids
        network.nodes[i].color = "white";
        network.nodes[i].inCdsTree = false;
        network.nodes[i].cdsParent = -1;
        network.nodes[i].cdsChildren = [];
    }
    //Also add some properties to the network object used later in the solutions 
    //(since the network object is a parameter in most functions, there is no need to add a new object holding these values)
    network.rootIndex = rootIndex;  //index to the root of the PIF tree inside the network.nodes array
    network.cdsRootIndex = -1;      //index to the root of the CDS tree inside the network.nodes array
    network.beginColorMarking = false;
    network.beginCDS = false;
    network.messageQueue = []; //it will be used to keep an order of the messages to be sent over the network
}

//Every node must have parent/children - use of the PIF algorithm (see references in README)
var _constructRootedTree = function(network){
    var edges = []; //Will be used for visually representing the tree
    var toBroadcastList = []; //It will hold which nodes will broadcast next
    //First the root sends to all its neighbors
    var neighbors = netOperator.returnNeighborObjects(network.nodes[network.rootIndex], network);
    for(var i=0; i<neighbors.length; i++){
        neighbors[i].parent = network.nodes[network.rootIndex].id;
        network.nodes[network.rootIndex].children.push(neighbors[i].id);
        network.nodes[network.rootIndex].childrenNotComplete ++;
        toBroadcastList.push(neighbors[i]);
        edges.push({"source" : network.nodes[network.rootIndex].id, "target" : neighbors[i].id});
    }   
    //Then the rest of the nodes broadcast
    var newBcastList;
    while(toBroadcastList.length > 0){
        newBcastList = [];
        for(var i=0; i<toBroadcastList.length; i++){
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
        }
        toBroadcastList = newBcastList;
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
var _sendMessage = function(type, node, receiver, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length -1].text = "<p>Node "+node.id+" ";
    var neighbors = netOperator.returnNeighborObjects(node, network);
    switch(type){
        case "level" :
            solution.steps[solution.steps.length -1].text += " with level "+node.level+" broadcasts LEVEL message.</p>";
            for(var i=0; i<neighbors.length; i++){
                _onReceiveLEVEL(neighbors[i], node.id, node.level, network, solution);
            }
            break;
        case "levelComplete":
            solution.steps[solution.steps.length -1].text += " with level "+node.level+" sends LEVEL COMPLETE message to parent "+node.parent+".</p>";
            var parent = netOperator.returnNodeById(node.parent, network);
            _onReceive_LEVEL_COMPLETE(parent, node.id, network, solution);
            break;
        case "black":
            solution.steps[solution.steps.length -1].text += "broadcasts BLACK message.</p>";
            if(node.root){
                solution.steps[solution.steps.length -1].data["colors"] = _returnColorArray(network);
            }
            for(var i=0; i<neighbors.length; i++){
                _onReceiveBLACK(neighbors[i], node.id, network, solution);
            }
            break;
        case "gray":
            solution.steps[solution.steps.length -1].text += "broadcasts GRAY message.</p>";
            for(var i=0; i<neighbors.length; i++){
                _onReceiveGRAY(neighbors[i], node.id, node.level, network, solution);
            }
            break;
        case "markComplete":
            solution.steps[solution.steps.length -1].text += "sends MARK COMPLETE message to parent "+node.parent+".</p>";
            var parent = netOperator.returnNodeById(node.parent, network);
            _onReceive_MARK_COMPLETE(parent, node.id, network, solution);
            break;
        case "query":
            solution.steps[solution.steps.length -1].text += "broadcasts QUERY message.</p>";
            solution.steps[solution.steps.length-1].data.edges = [];
            for(var i=0; i<neighbors.length; i++){
                _onReceiveQUERY(neighbors[i], node.id, network, solution);
            }
            break;
        case "report":
            solution.steps[solution.steps.length -1].text += "sends REPORT message to "+receiver.id+".</p>";
            solution.steps[solution.steps.length-1].data.edges = [];
            _onReceiveREPORT(receiver, node.id, node.blackList.length, network, solution);
            break;
        case "root" :
            solution.steps[solution.steps.length -1].text += "sends ROOT message to "+receiver.id+".</p>";
            solution.steps[solution.steps.length-1].data.edges = [];
            _onReceiveROOT(receiver, node.id, network, solution);
            break;
        case "invite1":
            solution.steps[solution.steps.length -1].text += "broadcasts INVITE1 message.</p>";
            solution.steps[solution.steps.length-1].data.edges = solution.result.edges.slice();
            for(var i=0; i<neighbors.length; i++){
                _onReceiveInvite1(neighbors[i], node.id, network, solution);
            }
            break;
        case "invite2":
            solution.steps[solution.steps.length -1].text += "broadcasts INVITE2 message.</p>";
            solution.steps[solution.steps.length-1].data.edges = solution.result.edges.slice();
            for(var i=0; i<neighbors.length; i++){
                _onReceiveInvite2(neighbors[i], node.id, network, solution);
            }
            break;
        case "join" :
            solution.steps[solution.steps.length -1].text += "sends JOIN message to "+receiver.id+".</p>";
            solution.steps[solution.steps.length-1].data.edges = solution.result.edges.slice();
            _onReceiveJOIN(receiver, node.id, network, solution);
            break;
        default : break;
    }   
    return true;
}

//Receiving a LEVEL message
var _onReceiveLEVEL= function(node, sender_id, sender_level, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received LEVEL message from "+sender_id+".</p>";
    if(sender_id == node.parent){
        node.level = sender_level+1;
        network.messageQueue.push({ sender : node.id, type : "level"});
        if(node.children.length == 0){  //i'm a leaf and now i know my level
            network.messageQueue.push({ sender : node.id, type : "levelComplete"});
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
            network.messageQueue.push({ sender : node.id, type : "levelComplete"});
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
            network.messageQueue.push({ sender : node.id, type : "gray"});
            if(node.children.length == 0){ //leaf
                network.messageQueue.push({sender : node.id, type : "markComplete"});
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
                network.messageQueue.push({ sender : node.id, type : "black"});
                if(node.children.length == 0){ //leaf
                    network.messageQueue.push({sender : node.id, type : "markComplete"});
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
            network.messageQueue.push({ sender : node.id, type : "markComplete"});
            solution.steps[solution.steps.length-1].text += "<p>The node got MARK COMPLETE from all children. It can brodcast MARK COMPLETE now.</p>";
        }
        else{
            network.beginCDS = true;
            solution.steps[solution.steps.length-1].text += "<p>The root got MARK COMPLETE from all children. The color marking process finished.</p>";
        }
    }
}

//Receive QUERY message
var _onReceiveQUERY = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received QUERY message from "+sender_id+".</p>";
    solution.steps[solution.steps.length-1].data.edges = [];
    if(node.color == "gray"){
        network.messageQueue.push({sender : node.id, receiver : sender_id , type : "report", blackNeighbors : node.blackList.length});
    }
}

//Receive Report message
var _onReceiveREPORT = function(node, sender_id, blackNeighbors, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received REPORT message from "+sender_id+" with a number of"+
    " black neighbors "+blackNeighbors+".</p>";   
    solution.steps[solution.steps.length-1].data.edges = [];
    if(node.root){
        node.nonLeveledNeighbors --;
        if(blackNeighbors > node.cdsDegree){
            node.cdsDegree = blackNeighbors;
            node.cdsRoot = sender_id;
        }
        if(node.nonLeveledNeighbors == 0){
            network.messageQueue.push({sender : node.id, receiver : node.cdsRoot , type : "root"});
        }
    }
}

//Receive a ROOT message
var _onReceiveROOT = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received ROOT message from "+sender_id+". It becomes the root of the CDS tree.</p>";  
    solution.steps[solution.steps.length-1].data.edges = [];
    network.cdsRootIndex = netOperator.returnNodeIndexById(node.id, network);
    node.inCdsTree = true;
    network.messageQueue.push({sender : node.id, type : "invite2"});
}

//Receive Invite2
var _onReceiveInvite2 = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received INVITE2 message from "+sender_id+".</p>"; 
    solution.steps[solution.steps.length-1].data.edges = solution.result.edges.slice();
    if((node.color == "black")&&(!node.inCdsTree)){
        node.inCdsTree = true;
        node.cdsParent = sender_id;
        network.messageQueue.push({sender: node.id, receiver : node.cdsParent, type : "join"});
        network.messageQueue.push({sender: node.id, type : "invite1"});
    }
}

//Receive Invite1
var _onReceiveInvite1 = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received INVITE1 message from "+sender_id+".</p>"; 
    solution.steps[solution.steps.length-1].data.edges = solution.result.edges.slice();
    if((node.color == "gray")&&(!node.inCdsTree)){
        node.inCdsTree = true;
        node.cdsParent = sender_id;
        network.messageQueue.push({sender: node.id, receiver : node.cdsParent, type : "join"});
        network.messageQueue.push({sender: node.id, type : "invite2"});
    }
}

//Receive JOIN
var _onReceiveJOIN = function(node, sender_id, network, solution){
    solution.createStep();
    solution.steps[solution.steps.length-1].text = "<p>Node "+node.id+" received JOIN message from "+sender_id+". It put the node to its children in the cds tree.</p>"; 
    solution.result.edges.push({"source" : node.id , "target": sender_id});
    solution.steps[solution.steps.length-1].data.edges = solution.result.edges.slice();
    node.cdsChildren.push(sender_id);
}

//Run the algorithm by sending messages 
var _beginMessaging = function(network, solution){
    //Level Marking process ==========================================
    solution["levels"].text = "<p class=\"solution-heading\"><strong>Part 1 :</strong> First we begin with the Level Marking process. Given the rooted spanning tree, the root broadcasts a LEVEL message first"+
    " and the process continues until all nodes have calculated their own levels.</p>";
    //root sends LEVEL message to the children first
    var rootNode = network.nodes[network.rootIndex];
    _sendMessage("level", rootNode, null, network, solution["levels"]);
    //then the rest of the nodes broadcast a LEVEL message
    var message;
    var sender;
    while(!network.beginColorMarking){
        message = network.messageQueue.shift(); //remove and return the first element
        sender = netOperator.returnNodeById(message.sender, network);
        switch(message.type){
            case "level": 
                _sendMessage("level", sender, null, network, solution["levels"]); 
                break;
            case "levelComplete": 
                _sendMessage("levelComplete", sender, null, network, solution["levels"]); 
                break;
            default : break;
        }
    }
    //Color marking process ===========================================
    solution["colors"].text = "<p class=\"solution-heading\"><strong>Part 2 :</strong> Now we continue with the color marking process. All nodes are initially marked with white color and will be marked with either"+
    " gray or black eventually.</p>";
    rootNode.color = "black";
    _sendMessage("black", rootNode, null, network, solution["colors"]);
    while(!network.beginCDS){
        message = network.messageQueue.shift(); //remove and return the first element
        sender = netOperator.returnNodeById(message.sender, network);
        switch(message.type){
            case "black": 
                _sendMessage("black", sender, null, network, solution["colors"]); 
                break;
            case "gray": 
                _sendMessage("gray", sender, null, network, solution["colors"]); 
                break;
             case "markComplete":
                 _sendMessage("markComplete", sender, null, network, solution["colors"]); 
                break;
            default : break;
        }
    }
    //keep the colors of the nodes at their current state as the final result of this process
    solution["colors"].data = _returnColorArray(network);
    //CDS construction ==============================================================
    solution["cds"].text = "<p class=\"solution-heading\"><strong>Part 3 :</strong> Now the construction of a Connected Dominating Set Tree will begin. The tree's root will be the gray"+
    " neighbor of the spanning tree root with the largest number of black neighbors.</p>";
    solution["cds"].result.edges = [];
    rootNode.nonLeveledNeighbors = rootNode.neighbors.length;
    _sendMessage("query", rootNode, null, network, solution["cds"]);
    var receiver;
    while(network.messageQueue.length > 0){
        message = network.messageQueue.shift(); //remove and return the first element
        sender = netOperator.returnNodeById(message.sender, network);
        switch(message.type){
            case "query": 
                _sendMessage("query", sender, null, network, solution["cds"]); 
                break;
            case "report":
                receiver = netOperator.returnNodeById(message.receiver, network);
                _sendMessage("report", sender, receiver, network, solution["cds"]); 
                break;
            case "root":
                receiver = netOperator.returnNodeById(message.receiver, network);
                _sendMessage("root", sender, receiver,  network, solution["cds"]); 
                solution["cdsRootColoringStep"] = solution["cds"].steps.length;
                break;
            case "invite2":
                _sendMessage("invite2", sender, null, network, solution["cds"]); 
                break;
            case "invite1":
                _sendMessage("invite1", sender, null, network, solution["cds"]); 
                break;
            case "join" :
                receiver = netOperator.returnNodeById(message.receiver, network);
                _sendMessage("join", sender, receiver, network, solution["cds"]); 
                break;
            default : break;
        }
    }
    solution["cdsRootIndex"] = network.cdsRootIndex;
    solution["cds"].result.edges = solution["cds"].steps[solution["cds"].steps.length - 1].data.edges.slice();
}

module.exports.newMIS = misFactory;