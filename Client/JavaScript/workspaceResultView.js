/*
This file has functions used to handle the response from the server
and visually represent the algorithms' results
*/
let stepDataArray = [];	//holds each step data in memory after the ajax response object is lost
let unidirectionalEdgesIndexes = []; //holds INDEXES not edge objects (to minimize data), which refer to positions in the step data Array. Used ONLY on LMST
let bidirectionalEdgeList = [];	//this one and the one below will hold edge objects when necessary
let unidirectionalEdgeList = [];
let topologyGraph = []; //will contain topology graph for LMST
let finalMisColors = []; //it will hold the final result of MIS coloring for repainting
let misRootIndex = -1;
let misPaintRootStepIndex = -1;	//from which step to start painting the MIS cds root 
let stepThreshold = -1; //it will be used with misPaintRootStepIndex
let max_min_clustersOrig = [];	//clusters after floodmax/min
let max_min_clustersAfter = []; //clusters after messaging
//Some color-styling globals used in our graph
var NODE_DEF_STYLE =  { circle : {fill: "#27a7ce", stroke: "#1986a8", "stroke-width" : "2"}, text: { fill : 'white'}};
let NODE_DOM_STYLE = {circle : {fill: "#51af1a", stroke: "#4f9e22", "stroke-width" : "2"}, text: { fill : 'white'}};
let NODE_MIS_STYLE = {
	"white" : {circle : {fill: "#efefef", stroke: "#444444", "stroke-width" : "2"}, text: { fill : '#444444'}},
	"gray" : { circle : {fill: "#777777", stroke: "#444444", "stroke-width" : "2"}, text: { fill : 'white'}},
	"black" : {circle : {fill: "#1e1e1e", stroke: "#222222", "stroke-width" : "2"}, text: { fill : 'white'}}
};
var LINK_DEFAULT = {'.connection': { stroke : "#444444", "stroke-width" : "2" }};
let LINK_BI = { '.connection': { stroke : "#2fd829", "stroke-width" : "3" } };
let LINK_UNI = { '.connection': { stroke : "#f4b218", "stroke-width" : "3" } };
let CLUSTER_COLORS = [
	{"head_color" : "#d81717", "group_color" : "#a00404", "stroke": "#a00404" },
	{"head_color" : "#3b4bf7", "group_color" : "#1c29b2", "stroke": "#1c29b2" },
	{"head_color" : "#d87117", "group_color" : "#b25401", "stroke": "#b25401" },
	{"head_color" : "#d8d817", "group_color" : "#adad05", "stroke": "#adad05" },
	{"head_color" : "#3ed817", "group_color" : "#26a008", "stroke": "#26a008" },
	{"head_color" : "#6b17d8", "group_color" : "#4d119b", "stroke": "#4d119b" },
	{"head_color" : "#17d89e", "group_color" : "#04a071", "stroke": "#04a071" },
	{"head_color" : "#888888", "group_color" : "#666666", "stroke": "#444444" },
	{"head_color" : "#3a3a3a", "group_color" : "#1e1e1e", "stroke": "#444444" },
	{"head_color" : "#b623c4", "group_color" : "#891193", "stroke": "#4f0556" },
	{"head_color" : "#684b22", "group_color" : "#4f381a", "stroke": "#3a2b16" }
];

//Max Min Table Object
var max_min_table = function(solution){
	this.text = "<div id='max_min_table_container'>";
	for(var i=0; i<network.nodes.length; i++){
		let line = 0;	//used for parsing, an index to the line of a cell
		this.text += "<div class=\"max_min_col_container\">";
		let id = network.nodes[i].id+"_"+line;
		line++;
		this.text += "<div class=\"max_min_col_heading\" id='"+id+"'><p>"+network.nodes[i].id+"</p></div>";
		for(var j=0; j<solution["floodmax"][i].length; j++, line++){
			id = network.nodes[i].id+"_"+line;
			this.text += "<div class=\"max_min_col_data\" id='"+id+"'><p>";	//column data container
			this.text += solution["floodmax"][i][j]["winner"];
			this.text += "</p></div>";
		}
		this.text += "<div class=\"max_min_col_divider\"></div>";
		for(var j=0; j<solution["floodmin"][i].length; j++, line++){
			id = network.nodes[i].id+"_"+line;
			this.text += "<div class=\"max_min_col_data\" id='"+id+"'><p>";	//column data container
			this.text += solution["floodmin"][i][j]["winner"];
			this.text += "</p></div>";
		}
		this.text += "</div>";
	}
	this.text += "</div>";
}

//Parse the id string of a cell in the max min table 
var _parseMaxMinId = function(idStr){
	let idS = "";	//id of the node to whom the column of this cell belongs
	let lineS = "";	//in which line of the flood table are we
	let i; //maintain index
	for(i=0; idStr[i] != '_'; i++){	//read the id first
		idS += idStr[i];
	}
	for(i=i+1; i<idStr.length; i++){	//read line
		lineS += idStr[i];
	}
	return { id : parseInt(idS), line : parseInt(lineS) };
}

//remove the highlighting of max min cells
var _removeMaxMinHighlight = function(){
	$(".max_min_col_heading").removeClass("cellCandidate");
	$(".max_min_col_data").removeClass("cellSelected");
	$(".max_min_col_data").removeClass("cellCandidate");
}

//Highlights the max min tables cells, the values of which where used 
//as candidates in the decision of the selected cell's value
var _highlightMaxMinCandidates = function(cellID){
	_removeMaxMinHighlight();
	let cell = _parseMaxMinId(cellID);
	$("#"+cellID).addClass("cellSelected");
	let node = returnNodeById(cell.id);
	for(var i=0; i<node.neighbors.length; i++){
		let neighID = node.neighbors[i] + "_" + (cell.line-1);
		$("#"+neighID).addClass("cellCandidate");
	}
	$("#"+node.id+"_"+(cell.line-1)).addClass("cellCandidate");
}

//will show text weights after DCA execution
var _showNodeWeights = function(weightMap){
	for(var i=0; i<weightMap.length; i++){
		var weightRect = new joint.shapes.basic.Rect({
			position: { x: network.nodes[i].graphic.position().x - 20, y: network.nodes[i].graphic.position().y - 20},
			size:{ width:40, height:25},
			attrs:{ 
				rect : {opacity : 0.0}, 
				text: {text : weightMap[i], fill : '#bf870f', "font-size" : "12pt", "font-weight" : "bold",  "fill-opacity" : "1.0"}
			},
			prop:{weight : true}
		});
		weightRect.on("change:position",function(){
			stopFunctionality("all");
		});
		graph.addCell(weightRect);
	}
	paper.scaleContentToFit({ "minScaleX" : nodeMinScale , "minScaleY" : nodeMinScale , "maxScaleX" : 1.0, "maxScaleY" : 1.0});
}

//hides all weight text
var _hideWeights = function(){
	var cells = graph.getElements();
	for(var i=0; i<cells.length; i++){
		if(cells[i].attributes.prop["weight"]){
			cells[i].remove();
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
var handleResponse = function(data, status, XMLHttpRequest){
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
var _clearViewAndData = function(){
	stepDataArray = []; //clear the global steps data from previous executions
	unidirectionalEdgesIndexes = [];
	bidirectionalEdgeList = [];
	unidirectionalEdgeList = [];
	finalMisColors = [];
	misRootIndex = -1;
	misPaintRootStepIndex = -1;
	stepThreshold = -1;
	max_min_clustersOrig = [];
	max_min_clustersAfter = [];
	topologyGraph = [];
	_clearView();
	_removeMaxMinHighlight();
}

//Clear View only
var _clearView = function(){
	_hideWeights();
	_hideArrowHeads();
	_paintEverythingDefault();
}

//Hides all arroheads
var _hideArrowHeads = function(){
	$(".marker-arrowhead-group-target").css({ "opacity" : "0"});
	$(".marker-arrowhead-group-source").css({ "opacity" : "0"});
}

//Repaints the edges with their original color
var _repaintEdgesDefault = function(){
	var links  = graph.getLinks();
	for(var i=0; i<links.length; i++){
		links[i].attr(LINK_DEFAULT);
	}
}

//Paint everything with the default color
var _paintEverythingDefault = function(){
	for(var j=0; j<network.nodes.length; j++){
		network.nodes[j].graphic.attr(NODE_DEF_STYLE);
	}
	_repaintEdgesDefault();
}

//Checks if a node is dominator
var _isDominator = function(id, dominatorList){
	for(var i=0; i<dominatorList.length; i++){
		if(id == dominatorList[i]){
			return true;
		}
	}
	return false;
}

//Paint dominators in the graph with the appropriate colors
var _paintDominators = function(dominatorList){	
	_repaintEdgesDefault();
	for(var j=0; j<network.nodes.length; j++){
		if(_isDominator(network.nodes[j].id, dominatorList)){
			network.nodes[j].graphic.attr(NODE_DOM_STYLE);
		}
	}
}

//Paint Clusters with different colors
var _paintClusters = function(clusterList){
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
var _paintEdgesFromList = function(edgeList, areUnidirectional){
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
var _paintUnidirectionalEdgesLMST = function(option_g0){
	var edge;
	var node;
	var links;
	var link;
	var source;
	var target;
	var style;
	var reverseDirection; //don't reverse direction
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
		reverseDirection =false;
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
				reverseDirection = true;
				break;
			}
		}
		link.attr(style);
		if(style == LINK_UNI){
			if(!reverseDirection){
				$("[ model-id ="+link.id+"]").find(".marker-arrowhead-group-target").css({ "opacity" : "1"}); //show the arrowhead
			}
			else{
				$("[ model-id ="+link.id+"]").find(".marker-arrowhead-group-source").css({ "opacity" : "1"}); //show the arrowhead
			}
		}
	}
}

//Paint the whole Topology tree using each node's local topology graph
var _paintTopologyTree = function(){
	_repaintEdgesDefault();
	for(var i=0; i<stepDataArray.length; i++){
		_paintEdgesFromList(stepDataArray[i], false);
	}
}

//Paint the MIS color marked nodes
var _paintMIS = function(nodeList){
	for(var i=0; i<nodeList.length; i++){
		switch(nodeList[i]){
			case "white" :	network.nodes[i].graphic.attr(NODE_MIS_STYLE["white"]); break;
			case "gray" : network.nodes[i].graphic.attr(NODE_MIS_STYLE["gray"]); break;
			case "black" : network.nodes[i].graphic.attr(NODE_MIS_STYLE["black"]); break;
		}
	}
}

//Paint mis Root
var _paintMisRoot =function(){
	network.nodes[misRootIndex].graphic.attr(NODE_DOM_STYLE);
}

//Integer list to string appropriate for word-break
var _strigifyIntList = function(list){
	var text = "[ ";
	if(list){
		for(var i=0; i<list.length; i++){
			text += list[i];
			if(i != (list.length-1)){
				text += ", "
			}
		}
	}
	text += " ]";
	return text;
}

//Show the steps from th Wu Li CDS algorithm
var _wuLiDominatorsAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var text = "<p class=\"solution-result colored-text word-break\">The algorithm's result is : "+ _strigifyIntList(response["solution"]["rule2"].result["dominators"])
				+"<br> Execution Analysis :</p>";
	//for each part of the solution
	for(var property in response["solution"]){
		if(response["solution"].hasOwnProperty(property)){
			//for each step of that part
			text += "<p class=\"solution-heading\">"+ response["solution"][property].text + "</p>"; 
			for(var j=0; j<response["solution"][property].steps.length; j++){
				text += "<a href=\"#\" class=\"dom-step step\" id=\""+stepId+"\">";
				text += response["solution"][property].steps[j].text;
				text += "<br/>Dominators " + _strigifyIntList(response["solution"][property].steps[j].data["dominators"]);
				text += "</a>";
				stepDataArray.push(response["solution"][property].steps[j].data["dominators"]);
				stepId ++;
			}
			text += "<p class=\"colored-text\">Results so far : " + _strigifyIntList(response["solution"][property].result["dominators"])+"</p>";
		}
	}
	$("#solutionBoxData").html(text);
	_paintDominators(response["solution"]["rule2"].result["dominators"]);
}

//Converts the result of the DCA algorithm to string 
var _stringifyDcaResult = function(clusters){
	var text = "";
	for(var i=0; i<clusters.length; i++){
		text += "{ head : "+clusters[i].clusterhead+" | group : ["+clusters[i]["group"]+"]} ";
	}
	return text;
}

//Show the steps of the Multipoint Relay CDS algorithm
var _mprCdsAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : "+ _strigifyIntList(response["solution"]["MPR_cds"].result["MPR_cds"])
				+" <br> Execution Analysis :</p>";
	if(response["solution"].hasOwnProperty("MPR_set")){
		text += "<p class=\"solution-heading\">"+ response["solution"]["MPR_set"].text + "</p>";
		for(var j=0; j<response["solution"]["MPR_set"].steps.length; j++){
			text += "<a href=\"#\" class=\"mpr-step step\" id=\""+stepId+"\">";
			text += response["solution"]["MPR_set"].steps[j].text;
			text += "<br/>MPR set : " + _strigifyIntList(response["solution"]["MPR_set"].steps[j].data["mpr_set"]);
			text += "</a>";
			stepDataArray.push(response["solution"]["MPR_set"].steps[j].data["mpr_set"]);
			stepId ++;
		}
		text += "<p class=\"colored-text\">MPR sets per node : [ ";
		for(var k=0; k<response["solution"]["MPR_set"].result["All_MPR_sets"].length; k++){
			text += "{ Node " + network.nodes[k].id + " : " + _strigifyIntList(response["solution"]["MPR_set"].result["All_MPR_sets"][k]) + " } ";
		}
		text += " ]</p>";
	}
	if(response["solution"].hasOwnProperty("MPR_cds")){
		text += "<p class=\"solution-heading\">"+ response["solution"]["MPR_cds"].text + "</p>";
		for(var j=0; j<response["solution"]["MPR_cds"].steps.length; j++){
			text += "<a href=\"#\" class=\"mpr-step step\" id=\""+stepId+"\">";
			text += response["solution"]["MPR_cds"].steps[j].text;
			text += "<br/>Dominators : " + _strigifyIntList(response["solution"]["MPR_cds"].steps[j].data["dominators"]);
			text += "</a>";
			stepDataArray.push(response["solution"]["MPR_cds"].steps[j].data["dominators"]);
			stepId ++;
		}
		text += "<p class=\"colored-text\">Results so far : " + _strigifyIntList(response["solution"]["MPR_cds"].result["MPR_cds"])+"</p>";
	}
	$("#solutionBoxData").html(text);
	_paintDominators(response["solution"]["MPR_cds"].result["MPR_cds"]);
}

//Show steps of the DCA algorithm
var _dcaAnalysis = function(response){
	_showNodeWeights(weightMap);
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<p class=\"solution-result colored-text\">The algorithm's result is : </p>"
	text += "<div><p class=\"solution-result colored-text4\">The clusterheads are : </p><p class=\"solution-result colored-text4\">";
	for(var i=0; i<solution.final_result.length; i++){
		text += "("+solution.final_result[i].clusterhead+") ";
	}
	text += "</p></div>";
	text += 	"<p class=\"solution-result colored-text2\"> [ "+_stringifyDcaResult(solution.final_result) +" ].</p>\
				<p class=\"solution-result colored-text4\">The weights given for each node : </p>\
				<p class='word-break colored-text4'>"+_stringifyWeights()+".</p>\
				<p class=\"solution-result colored-text\">Execution Analysis :</p>";		
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
	_paintClusters(solution.final_result);
}

//Show steps of Max Min D-Cluster algorithm
var _maxMinAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var table = new max_min_table(solution);
	var text = "<p class=\"solution-result colored-text2\"><strong>Part 1 : </strong> First the algorithm runs the floodmax stage and then the floodmin. The result of the floodmax and floodmin stages are shown in the table below. Use the buttons to show the result of each part of the algorithm. By default the floodmin/floodmax result is shown. Clink on a table cell, to see the candidate values that were compared, to select this cell's final value.</p>" +
	"<p class=\"solution-result colored-text4\"> [ "+_stringifyDcaResult(solution.clusters) +" ].</p>"
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"max_min_btn_orig\">Floodmax/Floodmin Result</button>";
	text += table.text; 
	text += "<div><p class=\"solution-result colored-text4\">The clusterheads are : </p><p class=\"solution-result colored-text4\">";
	for(var i=0; i<solution.clusters.length; i++){
		text += "("+solution.clusters[i].clusterhead+") ";
	}
	text +="</p></div>";
	text += "<div><p class=\"solution-result colored-text2\"><strong>Part 2 : </strong>After the floodmax and floodmin stages, the clusterheads broadcast a message to notify the other nodes to join their cluster.\
	 These messages are rebroadcasted by the receiving nodes, for a maximum of d-hops away from the clusterhead. The receiving nodes also \
	 choose as clusterhead, the one whose message reached them first. This process replaces the \
	 convergecast solution originally proposed, because the latter leads to infinite loops in some occassions.</p></div>"
	 +"<button class=\"btn btn_custom btn-default btn-margins\" id=\"max_min_btn_after\">Messaging Result</button>";
	for(var i=0; i<solution.messages_solution.steps.length; i++){
		text += "<a href=\"#\" class=\"max-min-step step\" id=\""+stepId+"\">";
		text += solution.messages_solution.steps[i].text;
		text += "</a>";
		stepDataArray.push(solution.messages_solution.steps[i].data);
		stepId++;
	}
	$("#solutionBoxData").html(text);
	max_min_clustersOrig = solution.clusters;
	max_min_clustersAfter = solution.clusters2;
	_paintClusters(max_min_clustersOrig);	
}

//Show steps of LMST algorithm
var _lmstAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<div><p class=\"solution-result colored-text\">Results of LMST algorithm on given network. Click on each step"+
	" to see the LMST for a specific node. Press the buttons below to show the whole tree again.</p>"
	+"<p class=\"small-line-color1 text-center\">bi-directional link</p>"
	+"<p class=\"small-line-color2 text-center\">uni-directional link</p>"
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"lmst_btn_orig\">Original Tree</button>"
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"lmst_btn_g0plus\">G0+</button>"
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"lmst_btn_g0minus\">G0-</button>"+"<p class=\"solution-result colored-text\">Execution Analysis :</p></div>";	
	for(var i=0; i<solution["step_data"].steps.length; i++){
		text += "<a href=\"#\" class=\"lmst-step step\" id=\""+stepId+"\">";
		text += solution["step_data"].steps[i].text;
		text += "</a>";
		stepDataArray.push(solution["LMSTs"][i].tree);
		stepId++;
	}
	unidirectionalEdgesIndexes = solution["uni-directional"];
	topologyGraph = solution["Topology"].slice();
	$("#solutionBoxData").html(text);
	_paintEdgesFromList(topologyGraph);
	_paintUnidirectionalEdgesLMST("0");
}

//Steps of the RNG Analysis
var _rngAnalysis = function(response){
	var stepId = 0; //will be used for indexing a global array of step data
	var solution = response["solution"];
	var text = "<div><p class=\"solution-result colored-text\">Results of RNG algorithm on given network. Click on each step"+
	" to see the selected edges of a specific node. Press the button below to show the whole tree again.</p>"
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"rng_btn_orig\">Original Tree</button>"
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
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"gg_btn_orig\">Original Tree</button>"
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
	"<p class=\"solution-result colored-text\">Execution Analysis :</p></div>"
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"mis_btn_rooted\">Rooted Tree</button>"
	+"<button class=\"btn btn_custom btn-default btn-margins\" id=\"mis_btn_cds\">CDS Tree</button>";
	text += solution["levels"].text;
	//No need to push these steps in the stepDataArray
	for(var i=0; i<solution["levels"].steps.length; i++){
		text += "<a href=\"#\" class=\"mis-step step mis-default\" >";	//we don't need ids for these
		text += solution["levels"].steps[i].text;
		text += "</a>";
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
	_paintEdgesFromList(bidirectionalEdgeList, false);
	_paintMisRoot();
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
		_showNodeWeights(weightMap);
		_paintClusters(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click", ".max_min_col_data", function(){
		_highlightMaxMinCandidates($(this).attr("id"));
	});

	$(document).on("click",".lmst-step",function(){
		_clearView();
		_paintEdgesFromList(stepDataArray[$(this).attr("id")], false);
	});

	$(document).on("click","#lmst_btn_orig",function(c){
		_clearView();
		_paintEdgesFromList(topologyGraph);
		_paintUnidirectionalEdgesLMST("0");
	});

	$(document).on("click","#lmst_btn_g0plus",function(c){
		_clearView();
		_paintEdgesFromList(topologyGraph);
		_paintUnidirectionalEdgesLMST("+");
	});

	$(document).on("click","#lmst_btn_g0minus",function(c){
		_clearView();
		_paintEdgesFromList(topologyGraph);
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

	$(document).on("click", "#mis_btn_rooted", function(){
		_clearView();
		_paintEdgesFromList(bidirectionalEdgeList, false);
	});

	$(document).on("click", "#mis_btn_cds", function(){
		_clearView();
		_paintMIS(finalMisColors);
		_paintEdgesFromList(bidirectionalEdgeList, false);
		_paintMisRoot();
		_paintEdgesFromList(unidirectionalEdgeList, true);
	});

	$(document).on("click","#max_min_btn_orig", function(){
		_clearView();
		_paintClusters(max_min_clustersOrig);
	});

	$(document).on("click","#max_min_btn_after", function(){
		_clearView();
		_paintClusters(max_min_clustersAfter);
	});

	$(document).on("click",".max-min-step",function(){
		_clearView();
		_paintClusters(stepDataArray[$(this).attr("id")]);
	});

	$(document).on("click", ".mis-default", function(){
		_clearView();
		_paintEdgesFromList(bidirectionalEdgeList, false);
	});
});