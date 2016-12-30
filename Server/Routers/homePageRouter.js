/*
This module routes requests that have to do with the homepage
*/
var express = require('express');
var app = module.exports = express();
var ehbs = require('express-handlebars');
var path = require('path');
var bodyParser = require('body-parser');
var sharedData = require('../../shared_data').sharedData; //shared preferences
var queriesModule = require('../../Database/queries.js');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

//set view engine
app.engine('hbs', ehbs({extname: 'hbs'}));
app.set('views', path.join(sharedData.rootDir, '/Client/Views'));
app.set('view-engine', 'hbs');
app.enable('view cache');

//Set up a router
var routerOptions = {
    caseSensitive : true,
    mergeParams : false,
    strict : false
}
var router = express.Router(routerOptions);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(session({
   // store : new MySQLStore(queriesModule.sessionConfig),
    secret: sharedData.secret, 
    resave:false, 
    saveUninitialized:true}));
app.use(router);//mount the router to the app

//Route the requests =======================================
router.get("/", function(request, response){
    //which algorithms are supported
    let templateData ={
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
    if(!request.session){
        console.log("New session to be created");
        let database = queriesModule.newQueryObject();
        database.connection.connect();
        let username = request.body.username;
        let password = request.body.password;
        database.logIn(request, response, username, password);
    }
    else{
        response.status(200).send("OK");
    }
});

router.post("/signUp", function(request, response){
    if(!request.session){
        console.log("New session to be created");
        let database = queriesModule.newQueryObject();
        database.connection.connect();
        let data = {
            first_name : request.body.first_name,
            last_name : request.body.last_name,
            username : request.body.username,
            password : request.body.password
        }
        database.signUp(request, response, data);
    }
    else{
        response.status(200).send("OK");
    }
});
