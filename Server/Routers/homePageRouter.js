/*
This module adds routing functions for GET requests to
an express router
*/
var express = require('express');
var app = module.exports = express();
var hbs = require('express-handlebars');
var path = require('path');
var rootDir = require('../../shared_data').sharedData.rootDir;

//set view engine
app.engine('hbs', hbs({extname: 'hbs'}));
app.set('views', path.join(rootDir, '/Client/Views'));
app.set('view-engine', 'hbs');
app.enable('view cache');

//Set up a router
var routerOptions = {
    caseSensitive : true,
    mergeParams : false,
    strict : false
}
var router = express.Router(routerOptions);

var tempData = {
    day : new Date().getDate(),
    month : new Date().getMonth(),
    year : new Date().getFullYear(),
    text : "<code>require('rest');</br>console.log(\"Please work :-(\");</code>"
}

//Route the requests =======================================
router.get("/", function(request, response){
    response.render("home.hbs", tempData);
});

app.use(router);