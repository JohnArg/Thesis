/* 
Main file/Starting point of the application
*/
var express = require('express');
var app = express();
var path = require('path');
var hbs = require('express-handlebars');
var homePageRouter = require('./Server/Routers/homePageRouter');
var workspaceRouter = require('./Server/Routers/workspaceRouter');
const port = 3000;

//set view engine
app.engine('hbs', hbs({extname: 'hbs'}));
app.set('views', __dirname + '/Client/Views');
app.set('view-engine', 'hbs');
app.enable('view cache');

//load static files 
app.use('/fonts', express.static(path.join(__dirname,'/Client/Fonts')));
app.use('/imgs',express.static(path.join(__dirname,'/Client/Images')));
app.use('/css',express.static(path.join(__dirname,'/Client/Css')));
app.use('/css',express.static(path.join(__dirname,'/Client/Css/External')));
app.use('/js',express.static(path.join(__dirname,'/Client/Javascript')));
app.use('/js',express.static(path.join(__dirname,'/Client/Javascript/External')));

//mount routers
app.use(homePageRouter);
app.use(workspaceRouter);

//start a Web Server at some port
app.listen(port, function(){
    console.log("AdHocEd application started at port "+port+" ..");
});