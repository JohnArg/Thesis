/*
This module routes requests that have to do with the homepage
*/
var express = require('express');
var app = module.exports = express();
var ehbs = require('express-handlebars');
var path = require('path');
var bodyParser = require('body-parser');
var rootDir = require('../../shared_data').sharedData.rootDir;
var queriesModule = require('../../Database/queries.js');

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

router.post("/logIn", function(request, response){
    var database = queriesModule.newQueryObject();
    database.connection.connect();
    var username = request.body.username;
    var password = request.body.password;
    var result = database.logIn(username, password);
    if(result == "err"){
        response.status(500).send({message : "Internal database error."});
    }
    else if(result == "fail"){
        response.status(200).send({message : "User not found."});
    }
    else{
        response.render("workspace.hbs",{ first_name : result});
    }
});

router.post("/signUp", function(request, response){
    var database = queriesModule.newQueryObject();
    database.connection.connect();
    var data = {
        first_name : request.body.first_name,
        last_name : request.body.last_name,
        username : request.body.username,
        password : request.body.password
    }
    var result = database.signUp(data);
    if(result == "err"){
        response.status(500).send({message : "Internal database error."});
    }
    else if(result == "exists"){
        response.status(200).send({message : "User already exists."});
    }
    else{
        response.render("workspace.hbs",{ first_name : data.first_name});
    }
});

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(router);//mount the router to the app