/*
This module adds routing functions for GET requests to
an express router
*/
function defineGETRoutes(router){

    //Home page router
    router.get("/", function(request, response){
        response.send('Hello World');
    });
}

module.exports.defineGETRoutes = defineGETRoutes;
