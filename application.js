/* 
Main file/Starting point of the application
*/
var express = require('express');
var app = express();
var routerOptions = {
    caseSensitive : true,
    mergeParams : false,
    strict : false
}
var router = express.Router(routerOptions); //create Router
require('./Server/Routers/routeGET').defineGETRoutes(router); //add GET functionality to router

app.use(router);
console.log("AdHocEd application started ..");
//start a Web Server at some port
app.listen(3000, function(){
    console.log("Server started..");
});