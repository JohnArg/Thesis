/*
Just return to the home page
*/
$(document).ready(function(){
    $("#btn_home").click(function(){
        window.location.href = "/";
    });
    $("#main_panel").height($(document).height() - $("#particles-js").height - 90);
    //load the particles effect
    particlesJS.load('particles-js','/js/particlesjs-config.json', function() {
    console.log('callback - particles.js config loaded');
    });
});