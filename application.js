/* 
Main file/Starting point of the application
*/
var express = require('express');
var app = express();
var path = require('path');
var hbs = require('express-handlebars');
var homePageRouter = require('./Server/Routers/homePageRouter');
var mysql      = require('mysql');

//connect to database
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'me',
  password : 'secret',
  database : 'my_db'
});

//set view engine
app.engine('hbs', hbs({extname: 'hbs'}));
app.set('views', __dirname + '/Client/Views');
app.set('view-engine', 'hbs');
app.enable('view cache');

//load static files 
app.use('/fonts', express.static(path.join(__dirname,'/Client/Fonts')));
app.use(express.static(path.join(__dirname,'/Client/Css')));
app.use(express.static(path.join(__dirname,'/Client/Css/External')));
app.use(express.static(path.join(__dirname,'/Client/Javascript')));
app.use(express.static(path.join(__dirname,'/Client/Javascript/External')));

//mount routers
app.use(homePageRouter);

//start a Web Server at some port
app.listen(3000, function(){
    console.log("AdHocEd application started ..");
});