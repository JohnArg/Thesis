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
		case "1" : _dominatorsAnalysis(data); break;
		case "2" : break;
		case "3" : break;
		case "4" : break;
		case "5" : break;
		case "6" : break;
		case "7" : break;
		case "8" : break;
		default:break;
	}
}


//Show the steps from a CDS algorithm
function _dominatorsAnalysis(response){
	stepDataArray = []; //clear the steps data from previous executions
	var stepId = 0; //will be used for indexing a global array of step data
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : [ "+response["solution"].final_result
				+" ]<br> Execution Analysis :</p>";
	//for each part of the solution
	for(var property in response["solution"]){
		if(response["solution"].hasOwnProperty(property) && property != "final_result"){
			//for each step of that part
			text += "<p class=\"solution-heading\">"+ response["solution"][property].text + "</p>"; 
			for(var j=0; j<response["solution"][property].steps.length; j++){
				text += "<div class=\"well dom-step\" id=\""+stepId+"\">";
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

//Handle clicks on objects related to algorithm results
$(document).ready(function(){
	$(document).on("click",".dom-step",function(){
		_paintDominators(stepDataArray[$(this).attr("id")]);
	});
});