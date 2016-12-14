/*
All network joint.js functionality will be placed here
We will also create a global network object from the
joint.js elements, to be used in our algorithm file.
*/
var Node = function (id_in, neighbors, graphic){
	this.id = id_in;
	this.neighbors = neighbors;
	this.graphic = graphic;
	this.position = { //It will only be updated before the ajax call
		x : 0,
		y : 0
	}
}
//The network class => an array of nodes
var Network = function (){
	this.nodes = [];
} 

var network = new Network();			//The Network object that holds all the network information
var graph = new joint.dia.Graph;		//the main graph object
var paper = new joint.dia.Paper({	//the main view panel 
    el: $('#graph_panel'),
    model: graph,
    gridSize: 1,
    restrictTranslate: true
});
var usedIds = []; 									//A list of the used node ids so far
var addingNode = false; 							//If the add node button is active
var removingNode = false;							//If the remoce node button is active
var linkSelect1 = false;							//I'm in 'select first node' functionality while drawing a link (edge)
var linkSelect2 = false;							//I'm in 'select second node' functionality while drawing a link
var linkStart;										//Start node of the link
var linkEnd; 										//End node of the link

//Returns a node object from the network
var returnNodeById = function(search_id){
 	if(network.nodes.length == 0){
 		console.log("Can't retrieve node from empty network");
 	}
 	else{
 		for(var i=0; i<network.nodes.length; i++){
 			if(network.nodes[i].id == search_id){
 				return network.nodes[i];
 			}
 		}
	}
}

//Return the index of a node with id = search_id
var returnNodeIndexById = function(search_id){
	if(network.nodes.length == 0){
 		console.log("Can't retrieve node from empty network");
 	}
 	else{
 		for(var i=0; i<network.nodes.length; i++){
 			if(network.nodes[i].id == search_id){
 				return i;
 			}
 		}
	}
}

$(document).ready(function(){
	//Graphics Management (with Joint Js) ================================================
    //Click on blank space of view callback (used for adding nodes to the point clicked)
    paper.on('blank:pointerclick',function(event, x, y){
    	//if adding a node is enabled
    	if (addingNode){
    		var nodeID = calculateNewId();
	  		//create the graphics shape at the position clicked
	    	var circleShape = new joint.shapes.basic.Circle({
	    		position: { x: x - 20, y: y - 20},
	    		size:{ width:35, height:35},
	    		attrs:{ circle: NODE_DEF_STYLE, text: { text : nodeID, fill : 'white'}},
	    		prop:{ node_id : nodeID}
	    	});
	    	//stop adding/removing nodes if you moved one
	    	circleShape.on("change:position",function(){
	   			stopFunctionality("all");
	    	});
	    	//add the new shape to the graph
	    	graph.addCell(circleShape);
	    	//create the node in the network
	    	var node = new Node( nodeID, [], circleShape);
	    	network.nodes.push(node);
	    	console.log(network);
	    }
    });

    //Click on a node callbacks
    paper.on('cell:pointerclick', function(cellView, evt, x, y) { 
    	//if we are removing nodes ======
		if (removingNode){
			//get the id of the node
			var shape_id = cellView.model.attributes.prop["node_id"];
			updateNeighborhoodOfRemoved(shape_id);
			//remove the shape from the graph
			cellView.model.remove();
			console.log(network);
		}
		//else if we are connecting nodes ======
		else if(linkSelect1){
			//I selected the first node to link (source). I need to select another one as the end of the link (edge)
			linkStart = cellView.model;
			linkSelect1 = false;
			linkSelect2 = true;
		}
		else if(linkSelect2){
			//I selected 2 nodes to link. An edge will be created between them and their neighboring sets will be updated
			linkEnd = cellView.model;
			linkSelect2 = false;
			if(linkStart != linkEnd){
				//update neighborhood for nodes
				var shape1_node = returnNodeById(linkStart.attributes.prop["node_id"]);
				var shape2_node = returnNodeById(linkEnd.attributes.prop["node_id"]);
				shape1_node.neighbors.push(shape2_node.id);
				shape2_node.neighbors.push(shape1_node.id);
				var link = new joint.dia.Link({
			        source: { id: linkStart.id }, // graph model ids
			        target: { id: linkEnd.id },
			        prop:{ node1: shape1_node.id, node2: shape2_node.id } //network ids
			    });
				link.attr(LINK_DEFAULT);
				//add the edge to the graph
				graph.addCell(link);
				console.log("Link ", link);
				//return funcitonality to selecting the source of a link
				linkSelect1 = true;
				console.log(network);
			}
			else{
				linkSelect1 = true;
			}
		}    
	});
 
 	//Callback to react to removing a link(edge) from the interface
 	graph.on('remove',function(cell){
 		if( (cell.attributes.type == "link") && !removingNode){
 			//get the source and target network ids
 			var id1 = cell.attributes.prop["node1"];
 			var id2 = cell.attributes.prop["node2"];
 			//get the network nodes with these ids
 			var networkNode1 = returnNodeById(id1);
 			var networkNode2 = returnNodeById(id2);
 			//update their neighborhoods
 			networkNode1.neighbors = networkNode1.neighbors.filter(function (el) {
 				return el != id2;
 			});
			networkNode2.neighbors = networkNode2.neighbors.filter(function (el) {
 				return el != id1;
 			}); 			
 		}
 		console.log(network);
 	});	
 	//Network stuff ==========================================================================
 	//Update the neighborhood of the removed node and its neighbors
 	function updateNeighborhoodOfRemoved(removed_shape_id){
		var neighbor_id;
		var neighborhood = returnNodeById(removed_shape_id).neighbors;
		var neighbor;
		//update neighborhood of removed node and its neighbors'
		if(neighborhood.length > 0){
			//for each of his neighbors, get their id
			for(var j=0; j<neighborhood.length; j++){
				neighbor_id = neighborhood[j];
				//find the node with that id in the network
				neighbor = returnNodeById(neighbor_id);
				neighbor.neighbors = neighbor.neighbors.filter(function(index) {
					return index != removed_shape_id ;
				});
			}
		}
		//remove the node from the network
		network.nodes = network.nodes.filter(function (el) {
			return el.id != removed_shape_id;
		});
		//update the used ids list
		usedIds = usedIds.filter(function(el){ 
			return el != removed_shape_id; 
		});	
 	}

 	/*
 	It will calculate a proper new id for a new node
 	If nodes were removed, then the new id will be the minimum of the removed ids
 	else it will be the maximum id + 1
 	*/
 	function calculateNewId(){
 		var newID = 0;
    	var maxID = 0;	
    	if(usedIds.length != 0){
    		maxID = Math.max.apply(Math,usedIds);
    	}
	  	//We set the new node's id. If an id is missing between min and max
	  	//this will be the new id
	  	for(var p=1; p<maxID; p++){
	  		if( usedIds.indexOf(p) == -1){
	  			newID = p;
	  			break;
	  		}
	  	}
	  	//If all ids between min and max where found in the list
	  	if(newID == 0){
	  		newID = maxID + 1;
	  	}	   	
	   	usedIds.push(newID);
	   	return newID;
 	}

    // Buttons ===========================================================================
	$("#add_btn").click(function(){
		addingNode = true;
		removingNode = false;
		linkSelect1 = false;
		linkSelect2 = false;
		//disable link tools
		$(".tool-remove").hide();
	});

	$("#rm_btn").click(function() {
		removingNode = true;
		addingNode = false;
		linkSelect1 = false;
		linkSelect2 = false;
		//disable link tools
		$(".tool-remove").hide();
	});

    $("#link_btn").click(function() {
    	linkSelect1 = true;
    	addingNode = false;
    	removingNode = false;
    	//disable link tools
		$(".tool-remove").hide();
    });

    $(".btn").click(function(){
    	$(".btn").removeClass("btn_clicked");
    	$(this).addClass("btn_clicked");
    })

    function stopFunctionality(options){
    	switch(options){
    		case "all" :
		    	addingNode = false;
		    	removingNode = false;
		    	linkSelect1 = false;
				linkSelect2 = false;
		    	removingLink = false;
				$(".tool-remove").show();
		    	$(".workspace_btn").removeClass("workspace_btn_clicked");
		    	break;
		    default: break;
		}
    }

 	//keyboard events ===================================================================
   	document.addEventListener("keydown", function(event) {
    	if(event.keyCode == '27'){
    		stopFunctionality("all");
    	}
    });
});
