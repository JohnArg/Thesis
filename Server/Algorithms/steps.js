/*
In this application we need to describe to the user
how an algorithm works, step by step.
This module will create "Solution" and Step" objects that will 
describe in text the steps of an algorithm. Its purpose is to
hold all the information needed, so the user can 
see the solution as a whole or click on individual steps 
and see the result of that step.
*/

//This object will hold the information for this step of execution
var Step = function(){
	this.text = "";
	this.data = {}; // see [1] above
}

//This object will contain info and the steps executed in a specific solution
var Solution = function(){
	this.text = "";	//optional extra text
	this.steps = []; //the steps of the solution
	var stepList = this.steps;
	this.result = {}; //see [1] above. Can hold an object showing the result so far
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