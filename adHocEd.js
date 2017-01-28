/* 
Main file/Starting point of the application
*/
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const port = 3000;

//We create as many workers as the cpus on the machine to run the main app
//They all share the same port
if (cluster.isMaster) {
    console.log("AdHocEd application started at port "+port+" ..");
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    var express = require('express');
    var app = express();
    var path = require('path');
    var hbs = require('express-handlebars');
    var homePageRouter = require('./Server/Routers/homePageRouter');
    var workspaceRouter = require('./Server/Routers/workspaceRouter');

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
    app.use('/js',express.static(path.join(__dirname,'/Client/JavaScript')));
    app.use('/js',express.static(path.join(__dirname,'/Client/JavaScript/External')));

    //mount routers
    app.use(homePageRouter);
    app.use(workspaceRouter);

    //start a Web Server at some port
    app.listen(port, function(){
       console.log(`AdHocEd worker ${cluster.worker.process.pid} online`);
    });
}