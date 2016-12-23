//fills out modals details
var modalsData = {
    modals : [
            {
            id : "logInModal",
            title : "Log in/Sing Up",
            body : "</div></div>",
            footer: "<button type=\"button\" class=\"btn btn-default btn-primary\" data-dismiss=\"modal\">Close</button>"+
					"<button type=\"button\" class=\"btn btn-default btn-primary accentColor\" id=\"log_in_btn\">Log in</button>"
                    +"<button type=\"button\" class=\"btn btn-default btn-primary accentColor\" id=\"sing_up_btn\">Sign Up</button>" 
            }
        ]
}

$(document).ready(function(){
    //Render the modals
    var modalsTemplate = Handlebars.templates['modals.hbs'];
    var modalsHtml = modalsTemplate(modalsData);
    $("#modals_container").html(modalsHtml);

});