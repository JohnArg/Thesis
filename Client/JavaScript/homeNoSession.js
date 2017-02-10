let footerHeight = 90;
let textSmall = "Welcome to AdHocEd, an educational \
application for students and teachers with graphical representation\
 of basic algorithms for Ad Hoc Wireless networks.";
let textLarge = "Welcome to AdHocEd, an educational application for students\
 and teachers with graphical representation of basic algorithms for Ad Hoc Wireless\
  networks. Create a free account to be able to save the graphs you design in the editor.";

//Changes the size of some stuff when the window is resized
var _responsiveSizes = function(){
    //hight reactions
    if($(window).height() <= 1720){
        $("#main_panel").height(1720);    
    }
    else{
        $("#main_panel").height($(window).height() -footerHeight - $("#particles-js").height());
    }

    //width reactions
    if($(window).width() <= 500){
        $(".jumbotron > p").text(textSmall);
        $(".home-btn").addClass("home-btn-small");
        $("#main_panel").width($(window).width()-40);
        $("img").addClass("img-extra-small");
        $("img").addClass("non-floater");
        $("input").addClass("input-small");
        $(".jumbotron > p").width($(window).width()-40);
        $(".jumbotron > p").css("font-size", "12pt");
    }
    else if($(window).width() <= 720){
        $(".jumbotron > p").text(textLarge);
        $(".home-btn").addClass("home-btn-small");
        $("#main_panel").width($(window).width()-40);
        $("img").addClass("img-small");
        $("img").addClass("non-floater");
        $("input").removeClass("input-small");
        $(".jumbotron > p").width($(window).width()-40);
        $(".jumbotron > p").css("font-size", "13pt");
    }
    else if($(window).width() <= 800){
        $(".home-btn").addClass("home-btn-small");
        $("#main_panel").width($(window).width()-40);
        $("img").addClass("img-small");
        $("img").removeClass("non-floater");
        $("input").removeClass("input-small");
        $(".jumbotron > p").width($(window).width()-40);
        $(".jumbotron > p").css("font-size", "14pt");
    }
    else{
        $(".home-btn").removeClass("home-btn-small");
        $("#main_panel").width(780);
        $("img").removeClass("img-small");
        $("img").removeClass("non-floater");
        $("input").removeClass("input-small");
        $(".jumbotron > p").width(700);
        $(".jumbotron > p").css("font-size", "14pt");
    }

    $("#main_panel").height($("section").height());
}

$(document).ready(function(){
    //load the particles effect
    particlesJS.load('particles-js','/js/particlesjs-config.json', function() {
    });
    //Initialize on ready
    $(window).on("load resize", function(){
        _responsiveSizes();
    });
	_responsiveSizes();
});