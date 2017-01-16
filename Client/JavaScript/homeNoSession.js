//fills out modals details
var modalsData = {
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
var footerHeight = 90;

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
    if($(window).width() <= 720){
        $(".home-btn").addClass("home-btn-small");
        $("#main_panel").width($(window).width()-40);
        $("img").addClass("img-small");
        $("img").addClass("non-floater");
        $(".jumbotron > p").width($(window).width()-40);
        $(".jumbotron > p").css("font-size", "13pt");
    }
    else if($(window).width() <= 800){
        $(".home-btn").addClass("home-btn-small");
        $("#main_panel").width($(window).width()-40);
        $("img").addClass("img-small");
        $("img").removeClass("non-floater");
        $(".jumbotron > p").width($(window).width()-40);
        $(".jumbotron > p").css("font-size", "14pt");
    }
    else{
        $(".home-btn").removeClass("home-btn-small");
        $("#main_panel").width(780);
        $("img").removeClass("img-small");
        $("img").removeClass("non-floater");
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
    particlesJS.load('particles-js','/js/particlesjs-config.json', ()=>{
    });
    //Initialize on ready
    $(window).on("load resize", ()=>{
        _responsiveSizes();
    });
	_responsiveSizes();
	
    //Button listeners ==================
    $("#enter_btn").click(()=>{
        window.location.href = "/workspace";
    });
});