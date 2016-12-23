/*
This module routes requests that have to do with the homepage
*/
var express = require('express');
var app = module.exports = express();
var ehbs = require('express-handlebars');
var path = require('path');
var rootDir = require('../../shared_data').sharedData.rootDir;

//set view engine
app.engine('hbs', ehbs({extname: 'hbs'}));
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

//Route the requests =======================================
router.get("/", function(request, response){
    //which algorithms are supported
    var templateData ={
        algorithms : [
        {name : "Wu & Li Connected Dominating Set"},
        {name : "Multipoint Relays Connected Dominating Set"},
        {name : "DCA clusters"},
        {name : "Max Min D-Cluster formation"},
        {name : "MIS (Maximal Independent Set) Connected Dominating Set"},
        {name : "LMST (Localized MST) topology graph"},
        {name : "RNG (Relative Neighborhood Graph) topology graph"},
        {name : "GG (Gabriel Graph) topology graph"}
        ],
    };
    response.render("home.hbs", templateData);
});

router.get("/workspace", function(request, response){
    
    response.render("workspace2.hbs");
});

//mount the router to the app
app.use(router);