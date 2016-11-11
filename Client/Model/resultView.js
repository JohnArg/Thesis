/*
This file has functions used to handle the response from the server
and represent the algorithms' results
*/

//checks if a node is dominator
function _isDominator(id, dominatorList){
	for(var i=0; i<dominatorList.length; i++){
		if(id == dominatorList[i]){
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
	1: wu li dominators list, 2: multipoint relays cds 
	3: dca, 4: max_min, 5: mis, 6: lmst. 7: rng, 8: gg
solution : the data to be sent to the client */
function handleResponse(data, status, XMLHttpRequest){
	switch(data["code"]){
		case "1" : _wuLiDominatorsAnalysis(data); break;
		case "2" : _mprCdsAnalysis(data); break;
		case "3" : break;
		case "4" : break;
		case "5" : break;
		case "6" : break;
		case "7" : break;
		case "8" : break;
		default:break;
	}
}


//Show the steps from th Wu Li CDS algorithm
function _wuLiDominatorsAnalysis(response){
	stepDataArray = []; //clear the global steps data from previous executions
	var stepId = 0; //will be used for indexing a global array of step data
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : [ "+response["solution"].final_result
				+" ]<br> Execution Analysis :</p>";
	//for each part of the solution
	for(var property in response["solution"]){
		if(response["solution"].hasOwnProperty(property) && property != "final_result"){
			//for each step of that part
			text += "<p class=\"solution-heading\">"+ response["solution"][property].text + "</p>"; 
			for(var j=0; j<response["solution"][property].steps.length; j++){
				text += "<div class=\"well dom-step step\" id=\""+stepId+"\">";
				text += response["solution"][property].steps[j].text;
				text += "<br/>Dominators [ " + response["solution"][property].steps[j].data["dominators"] +" ]";
				text += "</div>";
				stepDataArray.push(response["solution"][property].steps[j].data["dominators"]);
				stepId ++;
			}
			text += "<p class=\"colored-text\">Results so far : [ " + response["solution"][property].result["dominators"]+" ]</p>";
		}
	}
	$("#final_results").html(text);
	$("#final_results").show();
	_paintDominators(response["solution"].final_result);
}

//Show the steps of the Multipoint Relay CDS algorithm
function _mprCdsAnalysis(response){
	stepDataArray = []; //clear the global steps data from previous executions
	var stepId = 0; //will be used for indexing a global array of step data
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : [ "+response["solution"].final_result
				+" ]<br> Execution Analysis :</p>";
	if(response["solution"].hasOwnProperty("MPR_set")){
		text += "<p class=\"solution-heading\">"+ response["solution"]["MPR_set"].text + "</p>";
		for(var j=0; j<response["solution"]["MPR_set"].steps.length; j++){
			text += "<div class=\"well mpr-step step\" id=\""+stepId+"\">";
			text += response["solution"]["MPR_set"].steps[j].text;
			text += "<br/>MPR set [ " + response["solution"]["MPR_set"].steps[j].data["mpr_set"] +" ]";
			text += "</div>";
			stepDataArray.push(response["solution"]["MPR_set"].steps[j].data["mpr_set"]);
			stepId ++;
		}
		text += "<p class=\"colored-text\">MPR sets per node : [ ";
		for(var k=0; k<response["solution"]["MPR_set"].result["All_MPR_sets"].length; k++){
			text += "{ Node " + network.nodes[k].id + " : " +response["solution"]["MPR_set"].result["All_MPR_sets"][k] + " } ";
		}
		text += " ]</p>";
	}
	if(response["solution"].hasOwnProperty("MPR_cds")){
		text += "<p class=\"solution-heading\">"+ response["solution"]["MPR_cds"].text + "</p>";
		for(var j=0; j<response["solution"]["MPR_cds"].steps.length; j++){
			text += "<div class=\"well mpr-step step\" id=\""+stepId+"\">";
			text += response["solution"]["MPR_cds"].steps[j].text;
			text += "<br/>Dominators [ " + response["solution"]["MPR_cds"].steps[j].data["dominators"] +" ]";
			text += "</div>";
			stepDataArray.push(response["solution"]["MPR_cds"].steps[j].data["dominators"]);
			stepId ++;
		}
		text += "<p class=\"colored-text\">Results so far : [ " + response["solution"]["MPR_cds"].result["MPR_cds"]+" ]</p>";
	}
	$("#final_results").html(text);
	$("#final_results").show();
	_paintDominators(response["solution"].final_result);
}

//Handle clicks on objects related to algorithm results
$(document).ready(function(){
	$(document).on("click",".dom-step",function(){
		_paintDominators(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click",".mpr-step",function(){
		_paintDominators(stepDataArray[$(this).attr("id")]);
	});
});