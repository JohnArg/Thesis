/*
This file has functions used to handle the response from the server
and represent the algorithms' results
*/
var stepDataArray = [];
var unidirectionalEdges = [];
//Coloring Globals
//Some color globals used in our graph
var DEFAULTFILL = "#27a7ce";
var DOMINATOR_FILL = "#59cc16";
var DEFAULTSTROKE = "#1986a8";
var DOMINATOR_STROKE = "#4f9e22";
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
	stepDataArray = []; //clear the global steps data from previous executions
	unidirectionalEdges = [];
	_hideArrowHeads();
	switch(data["code"]){
		case "1" : _wuLiDominatorsAnalysis(data); break;
		case "2" : _mprCdsAnalysis(data); break;
		case "3" : _dcaAnalysis(data); break;
		case "4" : _maxMinAnalysis(data); break;
		case "5" : break;
		case "6" : _lmstAnalysis(data); break;
		case "7" : _rngAnalysis(data); break;
		case "8" : _ggAnalysis(data); break;
		default:break;
	}
}

//Paint everything with the default color
function _paintEverythingDefault(){
	for(var j=0; j<network.nodes.length; j++){
		network.nodes[j].graphic.attr({ circle: {fill: DEFAULTFILL, stroke : DEFAULTSTROKE}});
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
			network.nodes[j].graphic.attr({ circle: {fill: DOMINATOR_FILL, stroke : DOMINATOR_STROKE}});
		}
	}
}

//Paint Clusters with different colors
function _paintClusters(clusterList){
	_repaintEdgesDefault();
	var tempNode;
	var index = 0;
	//repaint all nodes with default color
	for(var i=0; i<network.nodes.length; i++){
		network.nodes[i].graphic.attr({ circle: {fill: DEFAULTFILL, stroke : DEFAULTSTROKE}});
	}
	//paint only the clusters
	for(var i=0; i< clusterList.length; i++){
		if( index == CLUSTER_COLORS.length){
			index = 0;
		}
		//paint the rest of the cluster
		for(var k=0; k<clusterList[i].group.length; k++){
			tempNode = returnNodeById(clusterList[i].group[k]);
			if(tempNode.id != clusterList[i].clusterhead){
				tempNode.graphic.attr({ circle: {fill: CLUSTER_COLORS[index]["group_color"], stroke : CLUSTER_COLORS[index]["stroke"]}});
			}
		}
		//paint clusterhead
		tempNode = returnNodeById(clusterList[i].clusterhead);
		tempNode.graphic.attr({ circle: {fill: CLUSTER_COLORS[index]["head_color"], stroke : CLUSTER_COLORS[index]["stroke"]}});
		index++;
	}
}

//Paint the edges of a list, use the global graph object to get the link graphics
function _paintEdgesFromList(edgeList){
	var node;
	var links;
	var source;
	var target;
	for(var i=0; i<edgeList.length; i++){
		node = returnNodeById(edgeList[i]["source"]); //we need it to get the graphics model
		links = graph.getConnectedLinks(node.graphic, {});
		for(var j=0; j<links.length; j++){
			source = links[j].attributes.prop.node1;
			target = links[j].attributes.prop.node2;
			if((source == edgeList[i]["source"])&&(target == edgeList[i]["target"])){
				link = links[j];
				break;
			}
			else if((source == edgeList[i]["target"])&&(target == edgeList[i]["source"])){
				link = links[j];
				break;
			}
		}
		link.attr(LINK_BI);
		//link.attr( { '.' : { filter: { name: 'blur', args: { x:1} } } } );
	}
}

/* Paint the unidirectional links from the stepDataArray and unidirectionalEdges globals
	option_g0 =:
	default --> paint the uni-directional links with their specified color
	"+" --> paint the uni-directional links with the bi-directional link color (g0+)
	"-" --> paint the uni-directional links with the deafault link color (g0-)
	options.g0
*/
function _paintUnidirectionalEdges(option_g0){
	var edge;
	var node;
	var links;
	var link;
	var source;
	var target;
	var style;
	if(option_g0 == "+"){
		style = LINK_BI;
	}
	else if(option_g0 == "-"){
		style = LINK_DEFAULT;
	}
	else{
		style = LINK_UNI;
	}
	for(var i=0; i<unidirectionalEdges.length; i++){
		edge = stepDataArray[ unidirectionalEdges[i][0] ][ unidirectionalEdges[i][1] ];
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
		//link.attr( { '.' : { filter: { name: 'blur', args: { x:1} } } } );
		if(style == LINK_UNI){
			var id = link.id;
			$("[ model-id ="+id+"]").find(".marker-arrowhead-group-target").css({ "opacity" : "1"}); //show the arrowhead
		}
	}
}

//Hides all arroheads
function _hideArrowHeads(){
	$(".marker-arrowhead-group-target").css({ "opacity" : "0"});
}

//Repaints the edges with their original color
function _repaintEdgesDefault(){
	var links  = graph.getLinks();
	for(var i=0; i<links.length; i++){
		links[i].attr(LINK_DEFAULT);
		//links[i].attr( { '.' : { filter: { name: 'blur', args: { x:0} } } } );
	}
}

//Paint the whole Topology tree
function _paintTopologyTree(){
	_repaintEdgesDefault();
	for(var i=0; i<stepDataArray.length; i++){
		_paintEdgesFromList(stepDataArray[i]);
	}
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
	$("#solutionBoxData").html(text);
	_paintEverythingDefault();
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
	$("#solutionBoxData").html(text);
	_paintEverythingDefault();
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
			text += "<div class=\"well dca-step step\" id=\""+stepId+"\">";
			text += solution["DCA_timesteps"][i].steps[j].text;
			text += "</div>";
			stepDataArray.push(solution["DCA_timesteps"][i].steps[j].data["clusters"]);
			stepId++;
		}
	}
	ajaxObject["extras"] = {};
	$("#solutionBoxData").html(text);
	_paintEverythingDefault();
	_paintClusters(response["solution"].final_result, network);
}

//Show steps of Max Min D-Cluster algorithm
var _maxMinAnalysis = function(response){
	var solution = response["solution"];
	var table = new max_min_table(solution);
	var text = "<p class=\"solution-result colored-text\">The result of the floodmax and floodmin stages are shown in the table below.</p>";
	text += table.text; 
	$("#solutionBoxData").html(text);
	_paintEverythingDefault();
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
		text += "<div class=\"well lmst-step step\" id=\""+stepId+"\">";
		text += solution["step_data"].steps[i].text;
		text += "</div>";
		stepDataArray.push(solution["LMSTs"][i]);
		stepId++;
	}
	unidirectionalEdges = solution["uni-directional"];
	$("#solutionBoxData").html(text);
	_paintEverythingDefault();
	_paintTopologyTree();
	_paintUnidirectionalEdges("0");
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
		text += "<div class=\"well rng-step step\" id=\""+stepId+"\">";
		text += solution["step_data"].steps[i].text;
		text += "</div>";
		stepDataArray.push(solution["RNG"][i]);
		stepId++;
	}
	$("#solutionBoxData").html(text);
	_paintEverythingDefault();
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
		text += "<div class=\"well gg-step step\" id=\""+stepId+"\">";
		text += solution["step_data"].steps[i].text;
		text += "</div>";
		stepDataArray.push(solution["GG"][i]);
		stepId++;
	}
	$("#solutionBoxData").html(text);
	_paintEverythingDefault();
	_paintTopologyTree();
}

//Handle clicks on objects related to algorithm results
$(document).ready(function(){
	$(document).on("click",".dom-step",function(){
		_paintEverythingDefault();
		_paintDominators(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click",".mpr-step",function(){
		_paintEverythingDefault();
		_paintDominators(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click",".dca-step",function(){
		_paintEverythingDefault();
		_paintClusters(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click",".lmst-step",function(){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintEdgesFromList(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click","#lmst_btn_orig",function(c){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintTopologyTree();
		_paintUnidirectionalEdges("0");
	});

	$(document).on("click","#lmst_btn_g0plus",function(c){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintTopologyTree();
		_paintUnidirectionalEdges("+");
	});

	$(document).on("click","#lmst_btn_g0minus",function(c){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintTopologyTree();
		_paintUnidirectionalEdges("-");
	});

	$(document).on("click","#rng_btn_orig",function(c){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintTopologyTree();
	});

	$(document).on("click",".rng-step",function(){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintEdgesFromList(stepDataArray[$(this).attr("id")]);
	});


	$(document).on("click","#gg_btn_orig",function(c){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintTopologyTree();
	});

	$(document).on("click",".gg-step",function(){
		_hideArrowHeads();
		_paintEverythingDefault();
		_paintEdgesFromList(stepDataArray[$(this).attr("id")]);
	});

});