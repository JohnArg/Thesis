/*
In this application we need to describe to the user
how an algorithm works, step by step.
This module will create "Step" objects that will describe
in text the steps of an algorithm. Its purpose is to
hold all the information needed, so when the user clicks
to a step panel, the current state of the program, will be 
shown.
*/
var Step = function(){
	this.text = "";
	this.data = {}; //the data object that holds current algorithm state
}

var Solution = function(){
	this.text = "";	//optional general description
	this.steps = [];
	this.result = {};
	this.createStep = function(stepList){
		var step = new Step();
		stepList.push(step);
	}
}

var solutionFactory = function(){
	return new Solution;
}

module.exports.solution = solutionFactory;