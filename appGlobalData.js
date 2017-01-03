/*
Load this to access global preferences
*/
module.exports.appGlobalData = {
    rootDir : __dirname,
    env : "DESIGN"  //Development enviroment for testing : "DESIGN" = disable sessions in routers for design purposes, Other strings run the normal app
}