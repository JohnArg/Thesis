/*
This module routes requests that have to do with the homepage
*/
var express = require('express');
var app = module.exports = express();
var ehbs = require('express-handlebars');
var path = require('path');
var bodyParser = require('body-parser');
var appGlobalData = require('../../appGlobalData').appGlobalData; //shared preferences
var queriesModule = require('../../Database/queries');
var session = require('../../Database/sessions').session;
var sessionConfig = require('../../Database/sessions').sessionConfig;
var sessionStore = require('../../Database/sessions').sessionStore;

//set view engine
app.engine('hbs', ehbs({extname: 'hbs'}));
app.set('views', path.join(appGlobalData.rootDir, '/Client/Views'));
app.set('view-engine', 'hbs');
app.enable('view cache');

//Set up a router
var routerOptions = {
    caseSensitive : true,
    mergeParams : false,
    strict : false
}
var router = express.Router(routerOptions);
//set up database session storage


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(session(sessionConfig));
app.use(router);//mount the router to the app

//Route the requests =======================================
router.get("/", function(request, response){
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

//Handles ajax log in request
router.post("/logIn", function(request, response){
    if(!appGlobalData.sessionsEnabled){ //if sessions are disabled
        response.status(200).send("OK");  //The message will force a redirect on client to /workspace
    }
    else{
        //check if session exists in the store
        sessionStore.get(request.session.id, (error, session)=>{
            if(error){ //error in session store
                reponse.status(500).send("Error when looking for session");
            }
            else{
                if(!session){ //No user is logged in
                    let database = queriesModule.newQueryObject();
                    database.connection.connect();
                    let username = request.body.username;
                    let password = request.body.password;
                    database.logIn(request, response, sessionStore, username, password);
                }
                else{ //User already logged in
                    response.status(200).send("OK");  //The message will force a redirect on client to /workspace
                }
            }
        });
    }
});

//Handles ajax Sign Up request
router.post("/signUp", function(request, response){
    if(!appGlobalData.sessionsEnabled){
        response.status(200).send("OK");  //The message will force a redirect on client to /workspace
    }
    else{
        //check if session exists in the store
        sessionStore.get(request.session.id, (error, session)=>{
            if(error){ //error in session store
                reponse.status(500).send("Error when looking for session");
            }
            else{
                if(!session){ //no user logged in
                    let database = queriesModule.newQueryObject();
                    database.connection.connect();
                    let data = {
                        first_name : request.body.first_name,
                        last_name : request.body.last_name,
                        username : request.body.username,
                        password : request.body.password
                    }
                    database.signUp(request, response, sessionStore, data);
                }
                else{ //A user is already logged in
                    response.status(200).send("OK");    //The message will force a redirect on client to /workspace
                }
            }
        });
    }
});
