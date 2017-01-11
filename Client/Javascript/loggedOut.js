/*
Just return to the home page
*/
var footerHeight = 90;

//Changes the size of some stuff when the window is resized
var _responsiveSizes = function(){
    if($(window).height() <= 1720){
        $("#main_panel").height(1720);    
    }
    else{
        $("#main_panel").height($(window).height() -footerHeight - $("#particles-js").height());
    }
}

$(document).ready(function(){
    $("#btn_home").click(function(){
        window.location.href = "/";
    });
    $("#main_panel").height($(document).height() - $("#particles-js").height - 90);
    //load the particles effect
    particlesJS.load('particles-js','/js/particlesjs-config.json', function() {
    });
    //Initialize on ready
	_responsiveSizes();
	//Capture Window events
	$(window).on('resize', function(){
    	_responsiveSizes();
	});
});