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
var dialogError = false;
var footerHeight = 90;
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
						<li>Moving a node automatically deselects the tools!</li>\
						<li>Press <b class=\"text-info\">Save</b> to save your graph.</li>\
						<li>Press <b class=\"text-info\">Load</b> to load one of your saved graphs.</li>\
						</ul>\
					</article>\
				</section>",
    	footer: "<button type=\"button\" class=\"btn btn-default btn_custom\" data-dismiss=\"modal\">Close</button>"
        },
		{
		id: "dca_dialog",
		title: "DCA Weights",
		body: "<p id=\"dca_dialog_heading\">Specify the weights of the nodes before execution. Each node must have a different weight.</p>\
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
		},
		{
		id: "save_modal",
		title : "Save Current Graph",
		body : "<p>Choose a name for the graph.</p>\
				<form>\
					<input type=\"text\" id=\"save_input\"> </br>\
				</form>",	
		footer : "<button type=\"button\" class=\"btn btn-default btn_custom\" data-dismiss=\"modal\">Close</button>"+
			"<button type=\"button\" class=\"btn btn-default btn_custom\" id=\"save_continue\">Save</button>"
		},
		{
		id: "load_modal",
		title : "Load Graph",
		body : "<p id='load_modal_txt'>Choose a previously saved graph to load.</p>\
				<div id=\"load_scroll\" class=\"scrollView\">\
					<ul id=\"load_list\" class=\"ul_no_numbering ul_child\">\
					</ul>\
				</div>",	
		footer : "<button type=\"button\" class=\"btn btn-default btn_custom\" data-dismiss=\"modal\">Close</button>"
		}
    ]
};

//Reset everything (Clear graph view and data so far)
function _reset(){
	graph.clear();
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

//update the position data of the network nodes before sending an ajax call
var _updateAjaxNet = function(){
	for(var i=0; i<network.nodes.length; i++){
		network.nodes[i].position.x = network.nodes[i].graphic.attributes.position.x;
		network.nodes[i].position.y = network.nodes[i].graphic.attributes.position.y;
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
	}
}

var _repaintGraph = function(newNetwork){
	_reset(); //reset everything
	for(var i=0; i<newNetwork.nodes.length; i++){
		let newNode = newNetwork.nodes[i];
		//create the graphics shape at the position clicked
		let circleShape = new joint.shapes.basic.Circle({
			position: { x: newNode.position.x - 20, y: newNode.position.y - 20},
			size:{ width:35, height:35},
			attrs:{ circle : {fill: "#27a7ce", stroke: "#1986a8", "stroke-width" : "2"}, text: { text : newNode.id, fill : 'white'}},
			prop:{ node_id : newNode.id}
		});
		//stop adding/removing nodes if you moved one
		circleShape.on("change:position",function(){
			stopFunctionality("all");
		});
		//add the new shape to the graph
		graph.addCell(circleShape);
		//create the node in the network
		let node = new Node( newNode.id, newNode.neighbors , circleShape);
		node.position.x = newNode.position.x;
		node.position.y = newNode.position.y;
		network.nodes.push(node);
		usedIds.push(node.id);
	}
	//we create the links after all the previous cells are included in the graph
	for(var i=0; i<network.nodes.length; i++){
		let node = network.nodes[i];
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
	$("#dca_dialog_scroll").hide();
	$("#tools_panel").height($("#main_container").height());
	$("#solutionBox").height($("#main_container").height());
	$("#solutionBox").width( Math.floor( $("#main_container").width()/5) );
	$("#solutionBoxData").height($("#solutionBox").height() - 65);
	$("#solutionBoxData").width($("#solutionBox").width()-20);
	$("#drawHeader").width($("#main_container").width() - $("#solutionBox").width() - $("#tools_panel").width() -20);
	$("#graph_panel").width($("#main_container").width() - $("#solutionBox").width() - $("#tools_panel").width());
	paper.setDimensions($("#graph_panel").width(), $("#graph_panel").height());
}

//Create the dca dialogue's list li elements
var _dcaDialogCreateInputs = function(){
	var text = "";
	for(var i=0; i<network.nodes.length; i++){
		text +="<li>";
		text +="<form>Node "+network.nodes[i].id+" <input type=\"number\" id=\"weight_"+i+"\"></form>";
		text += "</li>";
	}
	return text;
}

//If the dca dialog "OK" was clicked, handle the weight data to be sent to the server
var _dcaDialogWeightsHandler = function(){
	weightMap = [];
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
			}
			else{
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
    	paper.scaleContentToFit({ "minScaleX" : 0.5, "minScaleY" : 0.5, "maxScaleX" : 1.0, "maxScaleY" : 1.0});
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

	$("#link_log_out").click(function(){
		_sendLogOutRequest();
	});

	$("#link_delete_acc").click(function(){
		_sendDeleteAccountRequest();
	});

	$("#save_btn").click(function(){
		$("#save_modal").modal('show');
	});

	$("#save_continue").click(function(){
		let name  = $("#save_input").val();
		if(name == ""){
			alert("Please type in a name for this graph");
		}
		else{
			$("#save_modal").modal('hide');
			_sendSaveNetwork(name);
		}
	});

	$("#load_btn").click(function(){
		_sendRetrieveNetworks();
	});

	$(document).on("click",".delete_net",function(){
		let id = $(this).parent().parent().attr("id");
		_sendDeleteNetwork(id);
	});

	$(document).on("click",".confirm_load",function(){
		let id = $(this).parent().parent().attr("id");
		_sendLoadNetwork(id);
	});
});