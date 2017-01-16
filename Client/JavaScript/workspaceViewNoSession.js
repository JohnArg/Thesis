/*
This file will be used to alter the view of the page 
and handle user interaction
*/
var algorithm_code = "empty";
var algorithm_name;
var ajaxObject = {
	"code" : -1,
	"net" : {},
	"extras" : {}	//extra data assosiated with the network that an algorithm needs
};
var randomWeights = true;
var weightMap = [];
var weightMapTxt = "";
var dialogError = false;
var footerHeight = 90;
var showToolbar = false; //next time you hit toggle, hide the toolbar
var modalsData = {	//content to fill out modals rendered by handlebars
     modals : [
        {
         id : "mis_dialog",
        title : "Maximal Independent Set",
        body : "<form>Select a root for the spanning tree <input type=\"number\" id=\"mis_input\"></form>",
        footer: "<button type=\"button\" class=\"btn btn-default btn_custom\" data-dismiss=\"modal\">Close</button>"+
				"<button type=\"button\" class=\"btn btn-default btn_custom\" id=\"mis_continue\">Continue</button>"
        },
		 {
        id : "max_min_dialog",
        title : "Max Min D-Cluster",
        body : "<form>Select a positive integer value for d <input type=\"number\" id=\"max_min_input\"></form>",
        footer: "<button type=\"button\" class=\"btn btn-default btn_custom\" data-dismiss=\"modal\">Close</button>"+
				"<button type=\"button\" class=\"btn btn-default btn_custom\" id=\"max_min_continue\">Continue</button>"
        },
		{
        id : "instructions_dialog",
        title : "Instructions",
        body : "<section>\
					<article>\
						<p>Use the tools below to construct a connected network graph :</p>\
						<ul>\
						<li>Press <b class=\"text-info\">Add Node</b> and click on an area inside the graph view</li>\
						<li>Press <b class=\"text-info\">Remove Node</b> and select the nodes to be removed</li>\
						<li>Press <b class=\"text-info\">Link Nodes</b> and select two nodes to link</li>\
						<li>To remove a link, press <b class=\"text-info\">ESC</b> to deselect tools, and then hover the mouse over a link</li>\
						<li>Press <b class=\"text-info\">ESC</b> to stop the tools</li>\
						<li>Press <b class=\"text-info\">Clear Graph</b> to delete current network and clear the graph</li>\
						<li><span class='colored-text4'>Moving a node automatically deselects the tools!</span></li>\
						<li>Press <b class=\"text-info\">Save</b> to save your graph.</li>\
						<li>Press <b class=\"text-info\">Load</b> to load one of your saved graphs.<span class='colored-text4'> If you resize \
						the window, remember to refresh the page before loading a graph.</span></li>\
						</ul>\
					</article>\
				</section>",
    	footer: "<button type=\"button\" class=\"btn btn-default btn_custom\" data-dismiss=\"modal\">Close</button>"
        },
		{
		id: "dca_dialog",
		title: "DCA Weights",
		body: "<p id=\"dca_dialog_heading\">Specify the weights of the nodes before execution. Each node must have a different weight. Only accepts positive numbers.</p>\
					<form>\
						<input type=\"radio\" name=\"random\" checked id=\"weights_randomBtn\"> Random Weights </br>\
						<input type=\"radio\" name=\"random\" id=\"weights_customBtn\"> Insert weights manually </br>\
					</form>\
					<div id=\"dca_dialog_scroll\" class=\"scrollView\">\
						<ul id=\"dca_dialog_list\" class=\"ul_no_numbering ul_child\">\
						</ul>\
					</div>",
		footer: "<button type=\"button\" class=\"btn btn-default btn_custom\" data-dismiss=\"modal\">Close</button>"+
				"<button type=\"button\" class=\"btn btn-default btn_custom\" id=\"dca_dialog_continue\">Continue</button>"
		}
    ]
};
const nodeMinScale = 0.35;
var biggerNodeSize = true;

//Reset everything (Clear graph view and data so far)
function _reset(){
	graph.clear();
	biggerNodeSize = true;
	network.nodes = [];
	usedIds = []; 
	panelOffset = $("#graph_panel").offset();
	addingNode = false; 							
	removingNode = false;							
	linkSelect1 = false;							
	linkSelect2 = false;							
	linkStart = null;										
	linkEnd = null; 	 
	ajaxObject["extras"] = {};
	ajaxObject["net"] = { };	
}

//will be used by a button to set the size of the nodes to the original one
function _toggleNodeSize(){
	for(var i=0; i<network.nodes.length; i++){
		if(biggerNodeSize){	
			network.nodes[i].graphic.resize(45,45);
			network.nodes[i].graphic.attr("text/font-size", "16pt");
		}
		else{
			network.nodes[i].graphic.resize(35,35);
			network.nodes[i].graphic.attr("text/font-size", "12pt");
		}
	}
	if(biggerNodeSize){
		biggerNodeSize = false;
	}
	else{
		biggerNodeSize = true;
	}
	paper.scaleContentToFit({ "minScaleX" : nodeMinScale , "minScaleY" : nodeMinScale , "maxScaleX" : 1.0, "maxScaleY" : 1.0});
}

//update the position data of the network nodes before sending an ajax call
//We change negative values to positive or errors will occur
var _updateAjaxNet = function(){
	for(var i=0; i<network.nodes.length; i++){
		network.nodes[i].position.x = Math.abs(network.nodes[i].graphic.attributes.position.x);
		network.nodes[i].position.y = Math.abs(network.nodes[i].graphic.attributes.position.y);
	}
}

//Fill the scroll view of the load modal with the data retrieved from _sendRetrieveNetworks
var _fillLoadScrollView = function(data){
	if(data.length == 0){
		$("#load_modal_txt").text("No graphs saved.");
		$("#load_scroll").hide();
	}
	else{
		var text="";
		for(var i=0; i<data.length; i++){
			text += "<div id='"+data[i].id+"' class='well small_well'>\
						<p>"+data[i].name+"</p>\
						<div class='btn-group' role='group' aria-label='...'>\
						<button type='button' class='btn btn-default btn_danger small_btn delete_net'>Delete</button>\
						<button type='button' class='btn btn-default btn_custom small_btn confirm_load'>Load</button>\
						</div>\
					</div>";
		}
		$("#load_modal_txt").text("Choose a previously saved graph to load.");
		$("#load_scroll").html(text);
		$("#load_scroll").show();
	}
}

var _repaintGraph = function(newNetwork){
	_reset(); //reset everything
	$("#solutionBoxData").html("");
	for(var i=0; i<newNetwork.nodes.length; i++){
		var newNode = newNetwork.nodes[i];
		//create the graphics shape at the position clicked
		var circleShape = new joint.shapes.basic.Circle({
			position: { x: newNode.position.x, y: newNode.position.y},
			size:{ width:35, height:35},
			attrs:{ circle : {fill: "#27a7ce", stroke: "#1986a8", "stroke-width" : "2"},
				text: { text : newNode.id, fill : 'white', "font-size" : "12pt"}},
			prop:{ node_id : newNode.id}
		});
		//stop adding/removing nodes if you moved one
		circleShape.on("change:position",function(){
			stopFunctionality("all");
		});
		//add the new shape to the graph
		graph.addCell(circleShape);
		//create the node in the network
		var node = new Node( newNode.id, newNode.neighbors , circleShape);
		node.position.x = newNode.position.x;
		node.position.y = newNode.position.y;
		network.nodes.push(node);
		usedIds.push(node.id);
	}
	//we create the links after all the previous cells are included in the graph
	for(var i=0; i<network.nodes.length; i++){
		var node = network.nodes[i];
		//now add the links in the graph
		for(var j=0; j<node.neighbors.length; j++){
			if(node.id < node.neighbors[j]){ //to avoid duplicate edges, connect only with those with bigger ids
				var link = new joint.dia.Link({
			        source: { id: node.graphic.id }, // graph model ids
					target: { id: returnNodeById(node.neighbors[j]).graphic.id },
			        prop:{ node1: node.id, node2: node.neighbors[j] } //network ids
			    });
				link.attr(LINK_DEFAULT);
				//add the edge to the graph
				graph.addCell(link);
			}
		}
	}
	paper.scaleContentToFit({ "minScaleX" : nodeMinScale , "minScaleY" : nodeMinScale , "maxScaleX" : 1.0, "maxScaleY" : 1.0});
	$("#load_modal").modal('hide');
}

//Send an Ajax Request to the server ============================
var _sendLoadNetwork = function(id){
	$.ajax({
		url : server_url + "/loadNet",
		contentType: "application/json",
		method : "POST",
		dataType : "json",
		data: JSON.stringify({netID : id}),
		error: function(jqXHR, status, error){
			console.log(error);
			if(jqXHR.responseJSON){
				if(jqXHR.responseJSON.message){
					console.log(jqXHR.responseJSON.message);
					if(jqXHR.responseJSON.message == "reloggin"){
						window.location.href = "/workspace";
					}
				}
			}
		},
		success : function(response, status, XMLHttpRequest){
			_repaintGraph(response.data);
		}
	});
}

var _sendDeleteNetwork = function(id){
	$.ajax({
		url : server_url + "/deleteNet",
		contentType: "application/json",
		method : "POST",
		dataType : "json",
		data: JSON.stringify({netID : id}),
		error: function(jqXHR, status, error){
			console.log(error);
			if(jqXHR.responseJSON){
				if(jqXHR.responseJSON.message){
					console.log(jqXHR.responseJSON.message);
					if(jqXHR.responseJSON.message == "reloggin"){
						window.location.href = "/workspace";
					}
				}
			}
		},
		success : function(response, status, XMLHttpRequest){
			$("#load_modal").modal('hide');
		}
	});
}

var _sendRetrieveNetworks = function(){
	$.ajax({
		url : server_url + "/getGraphs",
		contentType: "application/json",
		method : "GET",
		dataType : "json",
		success: function(response, status, XMLHttpRequest){
			console.log(response.data)
			_fillLoadScrollView(response.data);
			$("#load_modal").modal("show");
		},
		error: function(jqXHR, status, error){
			console.log(error);
			if(jqXHR.responseJSON){
				if(jqXHR.responseJSON.message){
					console.log(jqXHR.responseJSON.message);
					if(jqXHR.responseJSON.message == "reloggin"){
						window.location.href = "/workspace";
					}
				}
			}
		}	
	});
}

var _sendSaveNetwork =function(netName){
	if(network.nodes.length == 0){
		alert("No graph to save.");
	}
	else{
		_updateAjaxNet();
		$.ajax({
			url: server_url + "/saveNet",
			contentType: "application/json",
			dataType: "json",
			type: "POST",
			data: JSON.stringify({name : netName, data : network}),
			success : function(){
				alert("Data Saved");
			},
			error: function(jqXHR, status, error){
				console.log(error);
				if(jqXHR.responseJSON){
					if(jqXHR.responseJSON.message){
						console.log(jqXHR.responseJSON.message);
						if(jqXHR.responseJSON.message == "reloggin"){
							window.location.href = "/workspace";
						}
					}
				}
			}
		});
	}
}

var _deleteNetwork = function(networkID){
	$.ajax({
		url: server_url + "/deleteNet",
		contentType: "application/json",
		dataType: "json",
		type: "POST",
		data: JSON.stringify({netID : networkID}),
		error: function(jqXHR, status, error){
			console.log(error);
			if(jqXHR.responseJSON){
				if(jqXHR.responseJSON.message){
					console.log(jqXHR.responseJSON.message);
					if(jqXHR.responseJSON.message == "reloggin"){
						window.location.href = "/workspace";
					}
				}
			}
		}
	});
}

var _sendAlgorithmRequest = function(){
	$.ajax({
		url: server_url + "/algorithms",
		contentType: "application/json",
		dataType: "json",
		type: "POST",
		data: JSON.stringify(ajaxObject),
		success : handleResponse,
		error: function(jqXHR, status, error){
           	console.log(error);
			if(jqXHR.responseJSON){
				if(jqXHR.responseJSON.message){
					console.log(jqXHR.responseJSON.message);
					if(jqXHR.responseJSON.message == "reloggin"){
						window.location.href = "/workspace";
					}
				}
			}
		}
	});
}

var _sendLogOutRequest = function(){
	$.ajax({
		url: server_url + "/logOut",
		type: "GET",
		error: function(jqXHR, status, error){
            console.log("Log out failed ", error);
			alert("Log out failed :-(");
		},
		success: function(){
			window.location.href = "/";
		}
	});
}

var _sendDeleteAccountRequest = function(){
	$.ajax({
		url: server_url + "/deleteAcc",
		type: "GET",
		error: function(jqXHR, status, error){
            console.log("Delete Account failed ", error);
			alert("Delete Account failed :-(");
		},
		success: function(){
			alert("Account sucessfully deleted.");
			window.location.href = "/";
		}
	});
}

//=======================================================
var _responsiveSizes = function(){
	if($(window).height() <= 1000){
        $("#main_container").height(1000);    
    }
    else{
        $("#main_container").height($(window).height() -footerHeight - $("#pageHeader").height());
    }
	$("#dca_dialog_scroll").hide();
	$("#tools_panel").height($("#main_container").height());
	$("#graph_panel").width(Math.floor($("#main_container").width()*3/5));
	$("#graph_panel").height( $("#main_container").height() );
	$("#solutionBox").height($("#main_container").height());
	if(showToolbar){ //it actually means that now it's hidden
		$("#solutionBox").width($("#main_container").width() - $("#graph_panel").width());		
	}
	else{
		$("#solutionBox").width($("#main_container").width() - $("#graph_panel").width() -$("#tools_panel").width());		
	}
	$("#solutionBoxData").height($("#solutionBox").height() - 65);
	$("#solutionBoxData").width($("#solutionBox").width()-20);
	paper.setDimensions($("#graph_panel").width(), $("#graph_panel").height());
}

var _toogleToolbar = function(){
	if(showToolbar){
		$("#tools_panel").show();
		$("#graph_panel").css("margin-left", $("#tools_panel").width()+"px");
		$("#solutionBox").width($("#main_container").width() - $("#graph_panel").width() -$("#tools_panel").width());
		$("#solutionBoxData").width($("#solutionBox").width()-20);
		showToolbar = false; //next time hide it
	}
	else{
		$("#tools_panel").hide();
		$("#graph_panel").css("margin-left", "0px");
		$("#solutionBox").width($("#main_container").width() - $("#graph_panel").width());
		$("#solutionBoxData").width($("#solutionBox").width()-20);
		showToolbar = true; //next time show it
	}
}

//Create the dca dialogue's list li elements
var _dcaDialogCreateInputs = function(){
	var text = "";
	for(var i=0; i<network.nodes.length; i++){
		text +="<li>";
		text +="<form>Node "+network.nodes[i].id+" <input type=\"number\" id=\"w_"+network.nodes[i].id+"\"></form>";
		text += "</li>";
	}
	return text;
}

//returns the weights of the nodes as a string
function _stringifyWeights(){
	var text = "[";
	for(var i=0; i<weightMap.length; i++){
		text += "Node " + network.nodes[i].id + " : " + weightMap[i];
		if(i != (weightMap.length-1)){
			text += ", "
		}
	}
	text += "]";
	return text;
}

//If the dca dialog "OK" was clicked, handle the weight data to be sent to the server
var _dcaDialogWeightsHandler = function(){
	weightMap = [];
	weightMapTxt = "";
	dialogError = false;
	var difference = 0;
	if(randomWeights){
		//use the ids as weights
		for(var i=0; i<network.nodes.length; i++){
			weightMap.push(network.nodes[i].id);
		}
		//then randomly suffle the weights
		weightMap = _.shuffle(weightMap);
		ajaxObject["extras"]["weights"] = weightMap;
		_sendAlgorithmRequest();
		$("#dca_dialog").modal("hide");
	}
	else{
		$("#dca_dialog_list").children().each(function(){
			var weightTxt = $(this).find("input").val();
			var number = parseInt(weightTxt);
			if(isNaN(number)){
				dialogError = true;
				weightMap = [];
				alert("Weights must be integer inputs");
				return false;
			}
			else{
				var textID = $(this).attr('id');
				textID = textID.slice(2);
				weightMap.push(number);
			}
		});
		if(!dialogError){
			difference = weightMap.length - _.uniq(weightMap).length;
			if(difference == 0){
				ajaxObject["extras"]["weights"] = weightMap;
				_sendAlgorithmRequest();
				$("#dca_dialog").modal("hide");
			}else{
				alert("Please don't insert duplicate weights.");
			}
		}
	}
}
//After loading doc ==========================================
$(document).ready(function() {	
	//add the modals to our html
    var modalsTemplate = Handlebars.templates['modals.hbs'];
    var modalsHtml = modalsTemplate(modalsData);
	$("#modals_container").html(modalsHtml);
	//Initialize on ready
	_responsiveSizes();
	//Capture Window events
	$(window).on('resize', function(){
    	_responsiveSizes();
    	paper.scaleContentToFit({ "minScaleX" : nodeMinScale, "minScaleY" : nodeMinScale, "maxScaleX" : 1.0, "maxScaleY" : 1.0});
	});

	//Buttons Reactions ===========================================================
	$("#execute_btn").click(function() {
		if(algorithm_code != "empty"){
			if(network.nodes.length > 2){
				ajaxObject.code = algorithm_code;
				_updateAjaxNet();
				ajaxObject.net = network;
				if(algorithm_code == "alg_3"){
					$("#dca_dialog_list").html(_dcaDialogCreateInputs());
					$("#dca_dialog").modal("show");
				}
				else if(algorithm_code == "alg_4"){
					$("#max_min_dialog").modal("show");
				}
				else if(algorithm_code == "alg_5"){
					$("#mis_dialog").modal("show");
				}
				else{
					_sendAlgorithmRequest();
				}	
			}
			else{
				alert("Network too small");
			}
		}	
	});

	$(".workspace_btn").click(function(){
		$(".workspace_btn").removeClass("workspace_btn_clicked");
		$(this).addClass("workspace_btn_clicked");
	});

	$("#clear_btn").click(function() {
		//Reinitialize the main global variables
		_reset();
	});

	$(".algorithm_select").click(function(){
		algorithm_name = $(this).text();
		algorithm_code = $(this).attr("id");
		$("#selection_text").text("You selected the " + algorithm_name + " algorithm");
	});

	$("#instructions_btn").click(function(){
		$("#instructions_dialog").modal("show");
		$("#instructions_btn").removeClass("workspace_btn_clicked");
		$("#instructions_btn").addClass("workspace_btn");
	});

	$("#dca_dialog_continue").click(function(){
		_dcaDialogWeightsHandler();
	});

	$("#max_min_continue").click(function(){
		var d = parseInt($("#max_min_input").val());
		if(isNaN(d)){
			alert("D must be a positive integer");
		}
		else{
			if(d>0){
				ajaxObject["extras"]["d"] = d;
				_sendAlgorithmRequest();
				$("#max_min_dialog").modal("hide");
			}
			else{
				alert("Please insert a positive value");
			} 
		}
	});

	$("#mis_continue").click(function(){
		var root = parseInt($("#mis_input").val());
		var max = _.max(usedIds);
		if(isNaN(root)){
			alert("root must be a positive integer <= "+max);
		}
		else{
			if(root>0 && root<=max){
				ajaxObject["extras"]["root"] = root;
				_sendAlgorithmRequest();
				$("#mis_dialog").modal("hide");
			}
			else{
				alert("Please insert a positive integer <= "+max);
			} 
		}
	});

	$("#weights_randomBtn").click(function(){
		randomWeights = true;
		$("#dca_dialog_scroll").hide();
	});

	$("#weights_customBtn").click(function(){
		randomWeights = false;
		$("#dca_dialog_scroll").show();
	});

	$("#toggle_tb_btn").click(function(){
		_toogleToolbar();
	});

	$("#toggle_node_size").click(function(){
		_toggleNodeSize();
	});

});