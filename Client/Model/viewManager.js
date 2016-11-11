/*
This file will be used to alter the view of the page 
and handle user interaction
*/
$(document).ready(function() {	
	var algorithm_code = "empty";
	var algorithm_name;
	var ajaxObject = {
		"code" : -1,
		"net" : {},
		"extras" : {}	//extra data assosiated with the network that an algorithm needs
	};
	var stepDataArray = [];

	//Reset everything ###################
	function _reset(options){
		if(options == "all"){
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
		}
		else{
			for(var i=0; i<network.nodes.length; i++){
				network.nodes[i].dominator = false;
				network.nodes[i].preferedBy = 0;
			}
		}
	}

	function _dcaDialogCreateInputs(){
		var text = "";
		for(var i=0; i<network.nodes.length; i++){
			text +="<li><p>Node "+network.nodes[i].id+"<p/></li>";
		}
		return text;
	}

	function _sendAjaxRequest(){
		$.ajax({
			url: "http://localhost:3000",
			contentType: "application/json",
			dataType: "json",
			type: "POST",
			data: JSON.stringify(ajaxObject),
			success : handleResponse
		});
	}
	//Buttons Reactions ===========================================================
	$("#final_results").hide();

	$("#results_btn").click(function() {
		if(algorithm_code != "empty"){
			if(network.nodes.length > 2){
				ajaxObject.code = algorithm_code;
				ajaxObject.net = network;
				if(algorithm_code == "alg_3"){
					$("#dca_dialog_list").html(_dcaDialogCreateInputs());
					$("#dca_dialog").dialog("open");
				}
				else{
					_sendAjaxRequest();
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
		_reset("all");
	});

	$(".a-algorithm").click(function(){
		algorithm_name = $(this).text();
		algorithm_code = $(this).attr("id");
		$("#selection_text").text("You selected the " + algorithm_name + " algorithm");
	});

	$("#dca_dialog").dialog({
		resizable: false,
      	height:500,
      	modal: true,
      	minWidth: 400,
      	autoOpen:false,
      	buttons: {
        	"OK": function() {
         	 $( this ).dialog( "close" );
        	}
      	},
      	dialogClass: "dialogTheme"
	});

});