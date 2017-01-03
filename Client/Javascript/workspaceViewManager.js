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
        footer: "<button type=\"button\" class=\"btn btn-default btn-primary\" data-dismiss=\"modal\">Close</button>"+
				"<button type=\"button\" class=\"btn btn-default btn-primary accentColor\" id=\"mis_continue\">Continue</button>"
        },
		 {
        id : "max_min_dialog",
        title : "Max Min D-Cluster",
        body : "<form>Select a positive integer value for d <input type=\"number\" id=\"max_min_input\"></form>",
        footer: "<button type=\"button\" class=\"btn btn-default btn-primary\" data-dismiss=\"modal\">Close</button>"+
				"<button type=\"button\" class=\"btn btn-default btn-primary accentColor\" id=\"max_min_continue\">Continue</button>"
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
						<li>Moving a node automatically deselects the tools</li>\
						</ul>\
					</article>\
				</section>",
    	footer: "<button type=\"button\" class=\"btn btn-default btn-primary\" data-dismiss=\"modal\">Close</button>"
        },
		{
		id: "dca_dialog",
		title: "DCA Weights",
		body: "<p id=\"dca_dialog_heading\">Specify the weights of the nodes before execution. Each node must have a different weight.</p>\
					<form>\
						<input type=\"radio\" name=\"random\" checked id=\"weights_randomBtn\"> Random Weights <br/>\
						<input type=\"radio\" name=\"random\" id=\"weights_customBtn\"> Insert weights manually <br/>\
					</form>\
					<div id=\"dca_dialog_scroll\" class=\"scrollView\">\
						<ul id=\"dca_dialog_list\" class=\"ul_no_numbering ul_child\">\
						</ul>\
					</div>",
		footer: "<button type=\"button\" class=\"btn btn-default btn-primary\" data-dismiss=\"modal\">Close</button>"+
				"<button type=\"button\" class=\"btn btn-default btn-primary accentColor\" id=\"dca_dialog_continue\">Continue</button>"
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

//Send an Ajax Request to the server
var _sendAlgorithmRequest =function(){
	$.ajax({
		url: server_url + "/algorithms",
		contentType: "application/json",
		dataType: "json",
		type: "POST",
		data: JSON.stringify(ajaxObject),
		success : handleResponse,
		error: function(jqXHR, status, error){
            if(jqXHR.responseJSON.message){
				if(qXHR.responseJSON.message == "reloggin"){
					window.location.href = "/workspace";
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

function _responsiveSizes(){
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
	//Create the dca dialogue's list li elements
	function _dcaDialogCreateInputs(){
		var text = "";
		for(var i=0; i<network.nodes.length; i++){
			text +="<li>";
			text +="<form>Node "+network.nodes[i].id+" <input type=\"number\" id=\"weight_"+i+"\"></form>";
			text += "</li>";
		}
		return text;
	}
	//If the dca dialog "OK" was clicked, handle the weight data to be sent to the server
	function _dcaDialogWeightsHandler(){
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
	
	function _updateAjaxNet(){
		for(var i=0; i<network.nodes.length; i++){
			network.nodes[i].position.x = network.nodes[i].graphic.attributes.position.x;
			network.nodes[i].position.y = network.nodes[i].graphic.attributes.position.y;
		}
	}

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

	$("#btn_log_out").click(function(){
		_sendLogOutRequest();
	});
});