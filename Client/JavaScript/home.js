//fills out modals details
let modalsData = {
    modals : [
            {
            id : "logInModal",
            title : "Log in",
            body : "<div>\
                    <p class=\"err_message text-center\"></p>\
                    <form class=\"text-center\">\
                        <p>Username : </p>\
                        <input type=\"text\" id=\"log_in_username\"></input></br>\
                        <p>Password :</p>\
                        <input type=\"password\" id=\"log_in_password\"></input>\
                    </form>\
                    </div>",
            footer: "<button type=\"button\" class=\"btn btn-default btn-primary\" data-dismiss=\"modal\">Close</button>"+
					"<button type=\"button\" class=\"btn btn-default btn-primary accentColor\" id=\"btn_commit_logIn\">Log in</button>"
            },
            {
            id : "signUpModal",
            title : "Sign Up",
            body : "<div>\
                    <p class=\"err_message text-center\"></p>\
                    <form class=\"text-center\">\
                        <p>First Name : </p>\
                        <input type=\"text\" id=\"sign_up_first_name\"></input></br>\
                        <p>Last Name : </p>\
                        <input type=\"text\" id=\"sign_up_last_name\"></input></br>\
                        <p>Username : </p>\
                        <input type=\"text\" id=\"sign_up_username\"></input></br>\
                        <p>Password</p>\
                        <input type=\"password\" id=\"sign_up_password\"></input>\
                    </form>\
                    </div>",
            footer: "<button type=\"button\" class=\"btn btn-default btn-primary\" data-dismiss=\"modal\">Close</button>"
                    +"<button type=\"button\" class=\"btn btn-default btn-primary accentColor\" id=\"btn_commit_signUp\">Sign Up</button>" 
            }
        ]
};
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
    //Render the modals
    let modalsTemplate = Handlebars.templates['modals.hbs'];
    let modalsHtml = modalsTemplate(modalsData);
    $("#modals_container").html(modalsHtml);
    //load the particles effect
    particlesJS.load('particles-js','/js/particlesjs-config.json', function() {
    });
    //Initialize on ready
    $(window).on("load resize", function(){
        _responsiveSizes();
    });
	_responsiveSizes();
	
    //Button listeners ==================
    $("#btn_logIn").click(function(){
        $(".err_message").text("");
        $("#logInModal").modal("show");
    });
    $("#btn_SignUp").click(function(){
        $(".err_message").text("");
        $("#signUpModal").modal("show");
    });
    $("#btn_commit_logIn").click(function(){
        let usernameIn = $("#log_in_username").val();
        let passwordIn = $("#log_in_password").val();
        let ajaxObject = {
            username : usernameIn,
            password : passwordIn
        }
        let empty = (usernameIn == "") || (passwordIn == "");
        if(empty){
            $(".err_message").text("Please fill in all the fields");
        }
        else{
            $.ajax({
                async: true,
                url: server_url + "/logIn",
                contentType: "application/json",
                type: "POST",
                data: JSON.stringify(ajaxObject),
                error : function(jqXHR, status, error){
                    if(jqXHR.responseJSON){
                        if(jqXHR.responseJSON.message){
                            $(".err_message").text(jqXHR.responseJSON.message);
                        }
                    }
                    else {$("#logInModal").modal("hide");}
                },
                success : function(response, status, XMLHttpRequest){
                    $("#logInModal").modal("hide");
                    window.location.href = "/workspace";
                }   
            });
        }
    });
    $("#btn_commit_signUp").click(function(){
        let first_nameIn = $("#sign_up_first_name").val();
        let last_nameIn = $("#sign_up_last_name").val();
        let usernameIn = $("#sign_up_username").val();
        let passwordIn = $("#sign_up_password").val();
        let ajaxObject = {
            first_name : first_nameIn,
            last_name : last_nameIn,
            username : usernameIn,
            password : passwordIn
        }
        let empty = (first_nameIn == "") || (last_nameIn == "") || (usernameIn == "") || (passwordIn == "");
        if(empty){
            $(".err_message").text("Please fill in all the fields");
        }
        else{
            $.ajax({
                async: true,
                url: server_url + "/signUp",
                contentType: "application/json",
                type: "POST",
                data: JSON.stringify(ajaxObject),
                error : function(jqXHR, status, error){
                    if(jqXHR.responseJSON){
                        if(jqXHR.responseJSON.message){
                            $(".err_message").text(jqXHR.responseJSON.message);
                        }
                    }
                    else{$("#signUpModal").modal("hide");}
                },
                success : function(response, status, XMLHttpRequest){
                    $("#signUpModal").modal("hide");
                    window.location.href = "/workspace";
                }
            });
        }
    });
});