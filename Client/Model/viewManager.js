/*
This file will be used to alter the view of the page 
*/
$(document).ready(function() {	
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

	//Paint dominators ========================================
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

	//Buttons ==================================================================================
	$("#final_results").hide();

	$("#results_btn").click(function() {
		$(".btn").removeClass("btn_clicked");
		$("#results_btn").addClass("btn_clicked");
		_reset();
		$("#final_results").show(200);	
	});

	$("#clear_btn").click(function() {
		//Reinitialize the main global variables
		_reset("all");
	});
});