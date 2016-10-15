/* 
Main file/Starting point of the application
*/
var server = require("./Server/server.js").createServer();
console.log("Application started executing..");
//start a Web Server at some port
server.startServer(3000);