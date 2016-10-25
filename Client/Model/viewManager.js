/*
This file will be used to alter the view of the page 
*/
$(document).ready(function() {	
	var algorithm_code;
	var algorithm_name;
	var ajaxObject = {
		"code" : -1,
		"net" : {}
	};
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

	//checks if a node is dominator
	function _isDominator(node, dominatorList){
		for(var i=0; i<dominatorList.length; i++){
			if(node.id == dominatorList[i]){
				return true;
			}
		}
		return false;
	}

	//Paint dominators
	function _paintDominators(dominatorList){	
		for(var j=0; j<network.nodes.length; j++){
			if(!_isDominator(network.nodes[j].id, dominatorList)){
				network.nodes[j].graphic.attr({ circle: {fill: DEFAULTFILL}});
			}
			else{
				network.nodes[j].graphic.attr({ circle: {fill: DOMINATOR_FILL}});
			}
		}
	}

	/*Check response type and use appropriate handler
	The response will be an object that contains the 
	fields:
	code : the type of data the algorithm returns so that 
		   the client knows how to handle the representation
		   1: dominators list
		   2: clusters list
		   3: max-min special view
		   4: topology data
	solution : the data to be sent to the client */
	function _handleResponse(data, status, XMLHttpRequest){
		switch(data["code"]){
			case "1" : _dominatorsAnalysis(data); break;
			case "2" :
			case "3" : break;
			case "4" : break;
			default:break;
		}
	}

	//show the steps from a CDS algorithm
	function _dominatorsAnalysis(response){
		var text = "<p class=\"solution-result colored-text\">The algorithm's result is : [ "+response["solution"].final_result
					+" ]<br> Execution Analysis :</p>";
		//for each part of the solution
		for(var property in response["solution"]){
			if(response["solution"].hasOwnProperty(property) && property != "final_result"){
				//for each step of that part
				text += "<p class=\"solution-heading\">"+ response["solution"][property].text + "</p>"; 
				for(var j=0; j<response["solution"][property].steps.length; j++){
					text += "<div class=\"well step\">";
					text += response["solution"][property].steps[j].text;
					text += "<br/>Dominators [ " + response["solution"][property].steps[j].data["dominators"] +" ]";
					text += "</div>";
				}
				text += "<p class=\"colored-text\">Results so far : [ " + response["solution"][property].result["dominators"]+" ]</p>";
			}
		}
		$("#final_results").html(text);
		$("#final_results").show();
	}

	//Buttons ==================================================================================
	$("#final_results").hide();

	$("#results_btn").click(function() {
		if(network.nodes.length > 2){
			ajaxObject.code = algorithm_code;
			ajaxObject.net = network;
			$.ajax({
			    url: "http://localhost:3000",
			    contentType: "application/json",
			    dataType: "json",
			    type: "POST",
			    data: JSON.stringify(ajaxObject),
			    success : _handleResponse
			});
		}
		else{
			alert("Network too small");
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

});