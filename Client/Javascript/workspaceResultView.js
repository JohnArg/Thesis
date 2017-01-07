/*
This file has functions used to handle the response from the server
and visually represent the algorithms' results
*/
var stepDataArray = [];	//holds each step data in memory after the ajax response object is lost
var unidirectionalEdgesIndexes = []; //holds INDEXES not edge objects (to minimize data), which refer to positions in the step data Array. Used ONLY on LMST
var bidirectionalEdgeList = [];	//this one and the one below will hold edge objects when necessary
var unidirectionalEdgeList = [];
var finalMisColors = []; //it will hold the final result of MIS coloring for repainting
var misRootIndex = -1;
var misPaintRootStepIndex = -1;	//from which step to start painting the MIS cds root 
var stepThreshold = -1; //it will be used with misPaintRootStepIndex
//Some color-styling globals used in our graph
var NODE_DEF_STYLE =  { circle : {fill: "#27a7ce", stroke: "#1986a8", "stroke-width" : "2"}, text: { fill : 'white'}};
var NODE_DOM_STYLE = {circle : {fill: "#59cc16", stroke: "#4f9e22", "stroke-width" : "2"}, text: { fill : 'white'}};
var NODE_MIS_STYLE = {
	"white" : {circle : {fill: "#efefef", stroke: "#444444", "stroke-width" : "2"}, text: { fill : '#444444'}},
	"gray" : { circle : {fill: "#777777", stroke: "#444444", "stroke-width" : "2"}, text: { fill : 'white'}},
	"black" : {circle : {fill: "#1e1e1e", stroke: "#222222", "stroke-width" : "2"}, text: { fill : 'white'}}
};
var LINK_DEFAULT = {'.connection': { stroke : "#444444", "stroke-width" : "2" }};
var LINK_BI = { '.connection': { stroke : "#2fd829", "stroke-width" : "3" } };
var LINK_UNI = { '.connection': { stroke : "#f4b218", "stroke-width" : "3" } };
var CLUSTER_COLORS = [
	{"head_color" : "#d81717", "group_color" : "#a00404", "stroke": "#a00404" },
	{"head_color" : "#3b4bf7", "group_color" : "#1c29b2", "stroke": "#1c29b2" },
	{"head_color" : "#d87117", "group_color" : "#b25401", "stroke": "#b25401" },
	{"head_color" : "#d8d817", "group_color" : "#adad05", "stroke": "#adad05" },
	{"head_color" : "#3ed817", "group_color" : "#26a008", "stroke": "#26a008" },
	{"head_color" : "#6b17d8", "group_color" : "#4d119b", "stroke": "#4d119b" },
	{"head_color" : "#17d89e", "group_color" : "#04a071", "stroke": "#04a071" }
];

//Max Min Table Object
var max_min_table = function(solution){
	this.text = "";
	for(var i=0; i<network.nodes.length; i++){
		this.text += "<div class=\"max_min_col_container\">";
		this.text += "<div class=\"max_min_col_heading\"><p>"+network.nodes[i].id+"</p></div>";
		for(var j=0; j<solution["floodmax"][i].length; j++){
			this.text += "<div class=\"max_min_col_data\"><p>";	//column data container
			this.text += solution["floodmax"][i][j]["winner"];
			this.text += "</p></div>";
		}
		this.text += "<div class=\"max_min_col_divider\"></div>";
		for(var j=0; j<solution["floodmin"][i].length; j++){
			this.text += "<div class=\"max_min_col_data\"><p>";	//column data container
			this.text += solution["floodmin"][i][j]["winner"];
			this.text += "</p></div>";
		}
		this.text += "</div>";
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
	_clearViewAndData();
	switch(data["code"]){
		case "1" : _wuLiDominatorsAnalysis(data); break;
		case "2" : _mprCdsAnalysis(data); break;
		case "3" : _dcaAnalysis(data); break;
		case "4" : _maxMinAnalysis(data); break;
		case "5" : _misAnalysis(data); break;
		case "6" : _lmstAnalysis(data); break;
		case "7" : _rngAnalysis(data); break;
		case "8" : _ggAnalysis(data); break;
		default:break;
	}
}

//Clear painted stuff and data from previous executions
function _clearViewAndData(){
	stepDataArray = []; //clear the global steps data from previous executions
	unidirectionalEdgesIndexes = [];
	bidirectionalEdgeList = [];
	unidirectionalEdgeList = [];
	finalMisColors = [];
	misRootIndex = -1;
	misPaintRootStepIndex = -1;
	stepThreshold = -1;
	_clearView();
}

//Clear View only
function _clearView(){
	_hideArrowHeads();
	_paintEverythingDefault();
}

//Hides all arroheads
function _hideArrowHeads(){
	$(".marker-arrowhead-group-target").css({ "opacity" : "0"});
	$(".marker-arrowhead-group-source").css({ "opacity" : "0"});
}

//Repaints the edges with their original color
function _repaintEdgesDefault(){
	var links  = graph.getLinks();
	for(var i=0; i<links.length; i++){
		links[i].attr(LINK_DEFAULT);
	}
}

//Paint everything with the default color
function _paintEverythingDefault(){
	for(var j=0; j<network.nodes.length; j++){
		network.nodes[j].graphic.attr(NODE_DEF_STYLE);
	}
	_repaintEdgesDefault();
}

//Checks if a node is dominator
function _isDominator(id, dominatorList){
	for(var i=0; i<dominatorList.length; i++){
		if(id == dominatorList[i]){
			return true;
		}
	}
	return false;
}

//Paint dominators in the graph with the appropriate colors
function _paintDominators(dominatorList){	
	_repaintEdgesDefault();
	for(var j=0; j<network.nodes.length; j++){
		if(_isDominator(network.nodes[j].id, dominatorList)){
			network.nodes[j].graphic.attr(NODE_DOM_STYLE);
		}
	}
}

//Paint Clusters with different colors
function _paintClusters(clusterList){
	var tempNode;
	var index = 0;
	//repaint all nodes with default color
	_paintEverythingDefault();
	//paint only the clusters
	for(var i=0; i< clusterList.length; i++){
		if( index == CLUSTER_COLORS.length){
			index = 0;
		}
		//paint the rest of the cluster
		for(var k=0; k<clusterList[i].group.length; k++){
			tempNode = returnNodeById(clusterList[i].group[k]);
			if(tempNode.id != clusterList[i].clusterhead){
				tempNode.graphic.attr({ circle: {fill: CLUSTER_COLORS[index]["group_color"], stroke : CLUSTER_COLORS[index]["stroke"]}, text: { fill : 'white'}});
			}
		}
		//paint clusterhead
		tempNode = returnNodeById(clusterList[i].clusterhead);
		tempNode.graphic.attr({ circle: {fill: CLUSTER_COLORS[index]["head_color"], stroke : CLUSTER_COLORS[index]["stroke"]}, text: { fill : 'white'}});
		index++;
	}
}

//Paint the edges of a list, use the global graph object to get the link graphics
//areUnidirectional is boolean
function _paintEdgesFromList(edgeList, areUnidirectional){
	var link;
	var node;
	var links;
	var source;
	var target;
	var linkID;
	var reverseSourceTarget = false;
	for(var i=0; i<edgeList.length; i++){
		node = returnNodeById(edgeList[i]["source"]); //we need it to get the graphics model
		links = graph.getConnectedLinks(node.graphic, {});
		for(var j=0; j<links.length; j++){
			source = links[j].attributes.prop.node1;
			target = links[j].attributes.prop.node2;
			reverseSourceTarget = false;
			if((source == edgeList[i]["source"])&&(target == edgeList[i]["target"])){
				link = links[j];
				break;
			}
			else if((source == edgeList[i]["target"])&&(target == edgeList[i]["source"])){
				reverseSourceTarget = true;
				link = links[j];
				break;
			}
		}
		if(!areUnidirectional){
			link.attr(LINK_BI);
		}
		else{
			link.attr(LINK_UNI);
			linkID = link.id;
			if(!reverseSourceTarget){
				$("[ model-id ="+linkID+"]").find(".marker-arrowhead-group-target").css({ "opacity" : "1"}); //show the arrowhead
			}
			else{
				$("[ model-id ="+linkID+"]").find(".marker-arrowhead-group-source").css({ "opacity" : "1"}); //show the arrowhead
			}
		}
	}
}

/* Paint the unidirectional links from the stepDataArray and unidirectionalEdgesIndexes globals
	option_g0 =:
	default --> paint the uni-directional links with their specified color
	"+" --> paint the uni-directional links with the bi-directional link color (g0+)
	"-" --> paint the uni-directional links with the deafault link color (g0-)
	options.g0
*/
function _paintUnidirectionalEdgesLMST(option_g0){
	var edge;
	var node;
	var links;
	var link;
	var source;
	var target;
	var style;
	var linkID;
	if(option_g0 == "+"){
		style = LINK_BI;
	}
	else if(option_g0 == "-"){
		style = LINK_DEFAULT;
	}
	else{
		style = LINK_UNI;
	}
	for(var i=0; i<unidirectionalEdgesIndexes.length; i++){
		edge = stepDataArray[ unidirectionalEdgesIndexes[i][0] ][ unidirectionalEdgesIndexes[i][1] ];
		node = returnNodeById(edge["source"]); //we need it to get the graphics model
		links = graph.getConnectedLinks(node.graphic, {});
		for(var j=0; j<links.length; j++){
			source = links[j].attributes.prop.node1;
			target = links[j].attributes.prop.node2;
			if((source == edge["source"])&&(target == edge["target"])){
				link = links[j];
				break;
			}
			else if((source == edge["target"])&&(target == edge["source"])){
				link = links[j];
				break;
			}
		}
		link.attr(style);
		if(style == LINK_UNI){
			linkID = link.id;
			$("[ model-id ="+linkID+"]").find(".marker-arrowhead-group-target").css({ "opacity" : "1"}); //show the arrowhead
		}
	}
}

//Paint the whole Topology tree
function _paintTopologyTree(){
	_repaintEdgesDefault();
	for(var i=0; i<stepDataArray.length; i++){
		_paintEdgesFromList(stepDataArray[i], false);
	}
}

//Paint the MIS color marked nodes
function _paintMIS(nodeList){
	for(var i=0; i<nodeList.length; i++){
		switch(nodeList[i]){
			case "white" :	network.nodes[i].graphic.attr(NODE_MIS_STYLE["white"]); break;
			case "gray" : network.nodes[i].graphic.attr(NODE_MIS_STYLE["gray"]); break;
			case "black" : network.nodes[i].graphic.attr(NODE_MIS_STYLE["black"]); break;
		}
	}
}

//Paint mis Root
function _paintMisRoot(){
	network.nodes[misRootIndex].graphic.attr(NODE_DOM_STYLE);
}

//Show the steps from th Wu Li CDS algorithm
function _wuLiDominatorsAnalysis(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : [ "+response["solution"].final_result
				+" ]<br> Execution Analysis :</p>";
	//for each part of the solution
	for(var property in response["solution"]){
		if(response["solution"].hasOwnProperty(property) && property != "final_result"){
			//for each step of that part
			text += "<p class=\"solution-heading\">"+ response["solution"][property].text + "</p>"; 
			for(var j=0; j<response["solution"][property].steps.length; j++){
				text += "<a href=\"#\" class=\"dom-step step\" id=\""+stepId+"\">";
				text += response["solution"][property].steps[j].text;
				text += "<br/>Dominators [ " + response["solution"][property].steps[j].data["dominators"] +" ]";
				text += "</a>";
				stepDataArray.push(response["solution"][property].steps[j].data["dominators"]);
				stepId ++;
			}
			text += "<p class=\"colored-text\">Results so far : [ " + response["solution"][property].result["dominators"]+" ]</p>";
		}
	}
	$("#solutionBoxData").html(text);
	_paintDominators(response["solution"].final_result);
}

//Converts the result of the DCA algorithm to string 
function _stringifyDcaResult(clusters){
	var text = "";
	for(var i=0; i<clusters.length; i++){
		text += "{ head : "+clusters[i].clusterhead+" | group : ["+clusters[i]["group"]+"]} ";
	}
	return text;
}

//Show the steps of the Multipoint Relay CDS algorithm
function _mprCdsAnalysis(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : [ "+response["solution"].final_result
				+" ]<br> Execution Analysis :</p>";
	if(response["solution"].hasOwnProperty("MPR_set")){
		text += "<p class=\"solution-heading\">"+ response["solution"]["MPR_set"].text + "</p>";
		for(var j=0; j<response["solution"]["MPR_set"].steps.length; j++){
			text += "<a href=\"#\" class=\"mpr-step step\" id=\""+stepId+"\">";
			text += response["solution"]["MPR_set"].steps[j].text;
			text += "<br/>MPR set [ " + response["solution"]["MPR_set"].steps[j].data["mpr_set"] +" ]";
			text += "</a>";
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
			text += "<a href=\"#\" class=\"mpr-step step\" id=\""+stepId+"\">";
			text += response["solution"]["MPR_cds"].steps[j].text;
			text += "<br/>Dominators [ " + response["solution"]["MPR_cds"].steps[j].data["dominators"] +" ]";
			text += "</a>";
			stepDataArray.push(response["solution"]["MPR_cds"].steps[j].data["dominators"]);
			stepId ++;
		}
		text += "<p class=\"colored-text\">Results so far : [ " + response["solution"]["MPR_cds"].result["MPR_cds"]+" ]</p>";
	}
	$("#solutionBoxData").html(text);
	_paintDominators(response["solution"].final_result);
}

//Show steps of the DCA algorithm
function _dcaAnalysis(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : [ "+_stringifyDcaResult(solution.final_result)
				+" ].</br>The weights given for each node by id order were : ["+ ajaxObject["extras"]["weights"] 
				+"].</br>Execution Analysis :</p>";		
	for(var i=0; i< solution["DCA_timesteps"].length; i++){
		text += "<p class=\"solution-heading\">"+ solution["DCA_timesteps"][i].text + "</p>";
		for(var j=0; j<solution["DCA_timesteps"][i].steps.length; j++){
			text += "<a href=\"#\" class=\"dca-step step\" id=\""+stepId+"\">";
			text += solution["DCA_timesteps"][i].steps[j].text;
			text += "</a>";
			stepDataArray.push(solution["DCA_timesteps"][i].steps[j].data["clusters"]);
			stepId++;
		}
	}
	ajaxObject["extras"] = {};
	$("#solutionBoxData").html(text);
	_paintClusters(response["solution"].final_result, network);
}

//Show steps of Max Min D-Cluster algorithm
var _maxMinAnalysis = function(response){
	var solution = response["solution"];
	var table = new max_min_table(solution);
	var text = "<p class=\"solution-result colored-text\">The result of the floodmax and floodmin stages are shown in the table below.</p>";
	text += table.text; 
	$("#solutionBoxData").html(text);
	_paintClusters(solution["clusters"], network);	
}

//Show steps of LMST algorithm
var _lmstAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<div><p class=\"solution-result colored-text\">Results of LMST algorithm on given network. Click on each step"+
	" to see the LMST for a specific node. Press the buttons below to show the whole tree again.</p>"
	+"<p class=\"small-line-color1 text-center\">bi-directional link</p>"
	+"<p class=\"small-line-color2 text-center\">uni-directional link</p>"
	+"<button class=\"btn btn-primary btn-default btn-margins\" id=\"lmst_btn_orig\">Original Tree</button>"
	+"<button class=\"btn btn-primary btn-default btn-margins\" id=\"lmst_btn_g0plus\">G0+</button>"
	+"<button class=\"btn btn-primary btn-default btn-margins\" id=\"lmst_btn_g0minus\">G0-</button>"+"<p class=\"solution-result colored-text\">Execution Analysis :</p></div>";	
	for(var i=0; i<solution["step_data"].steps.length; i++){
		text += "<a href=\"#\" class=\"lmst-step step\" id=\""+stepId+"\">";
		text += solution["step_data"].steps[i].text;
		text += "</a>";
		stepDataArray.push(solution["LMSTs"][i]);
		stepId++;
	}
	unidirectionalEdgesIndexes = solution["uni-directional"];
	$("#solutionBoxData").html(text);
	_paintTopologyTree();
	_paintUnidirectionalEdgesLMST("0");
}

//Steps of the RNG Analysis
var _rngAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<div><p class=\"solution-result colored-text\">Results of RNG algorithm on given network. Click on each step"+
	" to see the selected edges of a specific node. Press the button below to show the whole tree again.</p>"
	+"<button class=\"btn btn-primary btn-default btn-margins\" id=\"rng_btn_orig\">Original Tree</button>"
	+"<p class=\"solution-result2 text-warning\">The algorithm uses ONLY the edges of the graph to construct the topology tree. Even if a node"
	+" is inside the checked region between 2 other nodes, it will not be taken into account if there are no edges connecting him"+ 
	" with both of the 2 other nodes. Only an edge between 2 nodes denotes that one can reach the other.</p>"
	+"<p class=\"solution-result colored-text\">Execution Analysis :</p></div>";
	for(var i=0; i<solution["step_data"].steps.length; i++){
		text += "<a href=\"#\" class=\"rng-step step\" id=\""+stepId+"\">";
		text += solution["step_data"].steps[i].text;
		text += "</a>";
		stepDataArray.push(solution["RNG"][i]);
		stepId++;
	}
	$("#solutionBoxData").html(text);
	_paintTopologyTree();
}

//Steps of the GG Analysis
var _ggAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<div><p class=\"solution-result colored-text\">Results of GG (Gabriel Graph) algorithm on given network. Click on each step"+
	" to see the selected edges of a specific node. Press the button below to show the whole tree again.</p>"
	+"<button class=\"btn btn-primary btn-default btn-margins\" id=\"gg_btn_orig\">Original Tree</button>"
	+"<p class=\"solution-result2 text-warning\">The algorithm uses ONLY the edges of the graph to construct the topology tree. Even if a node"
	+" is inside the checked region between 2 other nodes, it will not be taken into account if there are no edges connecting him"+ 
	" with both of the 2 other nodes. Only an edge between 2 nodes denotes that one can reach the other.</p>"
	+"<p class=\"solution-result colored-text\">Execution Analysis :</p></div>";
	for(var i=0; i<solution["step_data"].steps.length; i++){
		text += "<a href=\"#\" class=\"gg-step step\" id=\""+stepId+"\">";
		text += solution["step_data"].steps[i].text;
		text += "</a>";
		stepDataArray.push(solution["GG"][i]);
		stepId++;
	}
	$("#solutionBoxData").html(text);
	_paintTopologyTree();
}

//Steps of MIS Analysis
var _misAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<div><p class=\"solution-result colored-text\">Results of the Maximal Independent Set (MIS) algorithm.</p>"+
	"<p class=\"solution-result colored-text\">Execution Analysis :</p></div>";
	text += solution["levels"].text;
	//No need to push these steps in the stepDataArray
	for(var i=0; i<solution["levels"].steps.length; i++){
		text += "<div class=\"well mis-step step\" >";	//we don't need ids for these
		text += solution["levels"].steps[i].text;
		text += "</div>";
	}
	text += solution["colors"].text;
	var oldData = [];	//show the data of the last changes
	for(var i=0; i<solution["colors"].steps.length; i++){
		text += "<a href=\"#\" class=\"mis-step mis-color step\" id=\""+stepId+"\">";
		text += solution["colors"].steps[i].text;
		text += "</a>";
		if("colors" in solution["colors"].steps[i].data){
			oldData = solution["colors"].steps[i].data["colors"].slice();
		}
		stepDataArray.push(oldData);
		stepId++;
	}
	stepThreshold = stepId - 1;
	text += solution["cds"].text;
	for(var i=0; i<solution["cds"].steps.length; i++){
		text += "<a href=\"#\" class=\"mis-step mis-cds step\" id=\""+stepId+"\">";
		text += solution["cds"].steps[i].text;
		text += "</a>";
		stepDataArray.push(solution["cds"].steps[i].data.edges);
		stepId++;
	}
	$("#solutionBoxData").html(text);
	finalMisColors = solution["colors"].data;
	bidirectionalEdgeList = solution["edges"];
	unidirectionalEdgeList = solution["cds"].result.edges;
	misRootIndex = solution["cdsRootIndex"];
	misPaintRootStepIndex = stepThreshold + solution["cdsRootColoringStep"];
	_paintMIS(finalMisColors);
	console.log(bidirectionalEdgeList);
	_paintEdgesFromList(bidirectionalEdgeList, false);
	_paintMisRoot();
	console.log(unidirectionalEdgeList);
	_paintEdgesFromList(unidirectionalEdgeList, true);
}

//Handle clicks on objects related to algorithm results
$(document).ready(function(){
	$(document).on("click", ".step", function(){
		$(".step").removeClass("step-selected");
		$(this).addClass("step-selected");
	});

	$(document).on("click",".dom-step",function(){
		_clearView();
		_paintDominators(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click",".mpr-step",function(){
		_clearView();
		_paintDominators(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click",".dca-step",function(){
		_clearView();
		_paintClusters(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click",".lmst-step",function(){
		_clearView();
		_paintEdgesFromList(stepDataArray[$(this).attr("id")], false);
	});

	$(document).on("click","#lmst_btn_orig",function(c){
		_clearView();
		_paintTopologyTree();
		_paintUnidirectionalEdgesLMST("0");
	});

	$(document).on("click","#lmst_btn_g0plus",function(c){
		_clearView();
		_paintTopologyTree();
		_paintUnidirectionalEdgesLMST("+");
	});

	$(document).on("click","#lmst_btn_g0minus",function(c){
		_clearView();
		_paintTopologyTree();
		_paintUnidirectionalEdgesLMST("-");
	});

	$(document).on("click","#rng_btn_orig",function(c){
		_clearView();
		_paintTopologyTree();
	});

	$(document).on("click",".rng-step",function(){
		_clearView();
		_paintEdgesFromList(stepDataArray[$(this).attr("id")], false);
	});


	$(document).on("click","#gg_btn_orig",function(c){
		_clearView();
		_paintTopologyTree();
	});

	$(document).on("click",".gg-step",function(){
		_clearView();
		_paintEdgesFromList(stepDataArray[$(this).attr("id")], false);
	});

	$(document).on("click", ".mis-color", function(){
		_clearView();
		_paintEdgesFromList(bidirectionalEdgeList, false);
		_paintMIS(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click", ".mis-cds", function(){
		_clearView();
		_paintMIS(finalMisColors);
		_paintEdgesFromList(bidirectionalEdgeList, false);
		if($(this).attr("id") >= misPaintRootStepIndex){
			_paintMisRoot();
		}
		_paintEdgesFromList(stepDataArray[$(this).attr("id")], true);
	});

});