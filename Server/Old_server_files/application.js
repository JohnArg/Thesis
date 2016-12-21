/* 
Main file/Starting point of the application
*/
var server = require("./Server/server.js").createServer();
console.log("AdHocEd application started ..");
//start a Web Server at some port
server.startServer(3000);