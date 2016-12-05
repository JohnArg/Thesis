/* This module will find all the possible paths between a start node s
and a destination node t.
*/
//Object Factory
var pathfindingFactory = function(){
	return new pathFinding();
}

//Main object
var pathFinding = function(){
	var that = this;
	that.pathList = [];
	that.findPaths = function(start, destination){
		_initializePathfinding(start, destination, that.pathList);
		_constructPaths(destination, that.pathList, network);
		_keepDestinationPaths(destination, that.pathList);
		return that.pathList;
	};
}

var Path = function(){
	vertices = [];
	complete = 0;	//1 if there is no other vertex to add, or 0 otherwise
}

//It will create only the paths from the 1-hop neighbors of the start node
function _initializePathfinding(start, destination, pathList){
	var path;
	var neighbors = start.neighbors;
	//for every neighbor of the start node make a new path
	for(var i=0; i< neighbors.length; i++){
		path = new Path();
		path.vertices = [];
		path.vertices.push(start.id);
		path.vertices.push(neighbors[i]);
		if(neighbors[i] == destination.id){
			path.complete = 1;
		}
		else{
			path.complete = 0;
		}
		pathList.push(path);
	}

}

//Checks if all the paths are complete
function _pathsComplete(pathList){
	for(var i=0; i<pathList.length; i++){
		if(pathList[i].complete == 0){
			return false;
		}
	}
	return true;
}

//Returns a new path list object, without the path you wish to remove
function _removePath(list, path){
	var newList = [];
	var list1;
	var list2;
	var difference;
	var newPath;
	list2 = path["vertices"].slice();
	for(var i=0; i< list.length; i++){
		list1 = list[i]["vertices"].slice();
		if(list1.length == list2.length){
			difference = false;
			for(var k=0; k<list1.length; k++){
				if(list1[k] != list2[k]){
					difference = true;
					break;
				}
			}
			if(difference){
				newPath = new Path();
				newPath.vertices = list1.slice();
				newPath.complete = list[i].complete;
				newList.push(newPath);
			}
		}
		else{
			newPath = new Path();
			newPath.vertices = list1.slice();
			newPath.complete = list[i].complete;
			newList.push(newPath);
		}
	}
	return newList;
}

//return a new path list copied from the original list 
function _copyPathList(list){
	var tempPath;
	var newList = [];
	newList = JSON.parse(JSON.stringify(list));
	return newList;
}

//locates a path in given list and returns an index to it
function _returnPathIndex(list, path){
	var list1;
	var list2;
	var difference;
	var index = -1;
	list2 = path["vertices"].slice();
	for(var i=0; i< list.length; i++){
		list1 = list[i]["vertices"].slice();
		if(list1.length == list2.length){
			difference = false;
			for(var k=0; k<list1.length; k++){
				if(list1[k] != list2[k]){
					difference = true;
					break;
				}
			}
			if(!difference){
				index = i;
			}
		}
	}
	return index;
}

//Constructs the paths until all are complete - Finds all possible paths
//avoiding cycles
function _constructPaths(destination, pathList, network){
	var pathList2; 
	var vertex;
	var newPaths;
	var tempPath;
	while(!_pathsComplete(pathList)){
		pathList2 = _copyPathList(pathList);
		//for every path
		for(var i=0; i < pathList.length; i++){
			if(pathList[i].complete == 0){
				//take the last vertex of this path
				vertex = pathList[i].vertices[pathList[i].vertices.length-1];	
				//give me the neighbors of this vertex that are not already in the path -> avoid cycles
				newPaths = _.difference(netOperator.returnNodeById(vertex, network), pathList[i].vertices);
				if( (newPaths.length == 0) || (vertex == destination.id) ){
					//Find the appropriate path - Due to adding/removing paths the order of paths might have changed
					//so we need to make sure we get the correct path 
					pathList2[ _returnPathIndex(pathList2, pathList[i]) ].complete = 1;
				}
				else{ //the path hasn't ended yet
					for(var j=0; j < newPaths.length; j++){
						tempPath = new Path();
						tempPath.vertices = pathList[i].vertices.slice();
						tempPath.vertices.push(newPaths[j]);
						if(newPaths[j] == destination.id){
							tempPath.complete = 1;
						}
						else{
							tempPath.complete = 0;
						}
						pathList2.push(tempPath);
					}
					pathList2 = _removePath(pathList2, pathList[i]);
				}

			}
		}
		pathList = _copyPathList(pathList2); //update pathList with the new paths
	}
}

//From all the paths found,, keep the ones that end to the destination
function _keepDestinationPaths(destination, pathList){
	var newList = [];
	var newPath;
	pathList.forEach(function(elem){
		if(elem["vertices"][elem["vertices"].length - 1] == destination.id){
			newPath = new Path();
			newPath.vertices = elem["vertices"].slice();
			newPath.complete = elem["complete"];
			newList.push(newPath);
		}
	});
	pathList = newList;
}

module.exports.newPathfinding = pathfindingFactory;