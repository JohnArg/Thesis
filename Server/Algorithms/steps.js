/*
In this application we need to describe to the user
how an algorithm works, step by step.
This module will create "Step" objects that will describe
in text the steps of an algorithm. Its purpose is to
hold all the information needed, so when the user clicks
to a step panel, the current state of the program, will be 
shown.

Numbered explanations referenced from the code:
[1]
	To be parsable from the client's viewManager.js, 
	CDS algorithms should insert (key -> "dominators" : value -> dominator list).
*/

//This object will hold the information for this step of execution
var Step = function(){
	this.text = "";
	this.data = {}; // see [1] above
}

//This object will contain info and the steps executed in a specific solution
var Solution = function(){
	this.text = "";	//optional general description
	this.steps = [];
	var stepList = this.steps;
	this.result = {}; //see [1] above
	this.createStep = function(){
		var step = new Step();
		stepList.push(step);
	}
}

//Used to create Solution objects. Some algorithms have more than one part in their
//execution and they need one Solution object per part.
var solutionFactory = function(){
	return new Solution();
}

module.exports.solution = solutionFactory;