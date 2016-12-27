//fills out modals details
var modalsData = {
    modals : [
            {
            id : "logInModal",
            title : "Log in",
            body : "<div>\
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
}

$(document).ready(function(){
    //Render the modals
    var modalsTemplate = Handlebars.templates['modals.hbs'];
    var modalsHtml = modalsTemplate(modalsData);
    $("#modals_container").html(modalsHtml);
    //load the particles effect
    particlesJS.load('particles-js','/js/particlesjs-config.json', function() {
    console.log('callback - particles.js config loaded');
    });
    //Button listeners ==================
    $("#btn_logIn").click(function(){
        $("#logInModal").modal("show");
    });
    $("#btn_SignUp").click(function(){
        $("#signUpModal").modal("show");
    });
    $("#btn_commit_logIn").click(function(){
        var usernameIn = $("#log_in_username").val();
        var passwordIn = $("#log_in_password").val();
        var ajaxObject = {
            username : usernameIn,
            password : passwordIn
        }
        $.ajax({
            url: server_url + "/logIn",
            contentType: "application/json",
            dataType: "json",
            type: "POST",
            data: JSON.stringify(ajaxObject),
            success : function(data, status, XMLHttpRequest){
                if(data.message){
                    alert(data.message);
                }
            }
	    });
    });
    $("#btn_commit_signUp").click(function(){
        var first_nameIn = $("#sign_up_first_name").val();
        var last_nameIn = $("#sign_up_last_name").val();
        var usernameIn = $("#sign_up_username").val();
        var passwordIn = $("#sign_up_password").val();
        var ajaxObject = {
            first_name : first_nameIn,
            last_name : last_nameIn,
            username : usernameIn,
            password : passwordIn
        }
        $.ajax({
            url: server_url + "/signUp",
            contentType: "application/json",
            dataType: "json",
            type: "POST",
            data: JSON.stringify(ajaxObject),
            success : function(data, status, XMLHttpRequest){
                if(data.message){
                    alert(data.message);
                }
            }
	    });
    });
});