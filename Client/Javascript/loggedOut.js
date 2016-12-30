/*
Just return to the home page
*/
$(document).ready(function(){
    $("#btn_home").click(function(){
        window.location.href = "/";
    });
    $("#main_panel").height($(document).height() - $("#particles-js").height - 90);
});