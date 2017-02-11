var mysql = require('mysql');
var connectionPool = mysql.createPool({
    connectionLimit : 200,
    host     : 'localhost',
    port     : 3344,
    user     : 'adhoc',
    password : 'adhoced@!0091$',
    database : 'adhoced'
});

var signUp = function(request, response, sessionStore, user){
    connectionPool.getConnection((err, connection)=>{
        if(err){
            console.log("Could not get connection from pool");
        }
        else{
            //First check if the user already exists
            let queryStr = "SELECT * FROM users WHERE username=?";
            connection.query(queryStr, [user.username], function(err, rows){
                if(err){
                    connection.release();
                    response.status(500).send({message : "Internal database error."});
                }
                else{
                    if(rows.length != 0){
                        connection.release();
                        response.status(400).send({message : "User already exists."});
                    }
                    else{
                        //If the user doesn't already exist insert the data to the database
                        let queryStr = "INSERT INTO users (first_name, last_name, username, password) VALUES (?,?,?,?);";
                        connection.query(queryStr, [user.first_name, user.last_name, user.username, user.password], function(err){
                            connection.release();
                            if(err){
                                response.status(500).send({message : "Internal database error."});
                            }
                            else{
                                request.session.first_name = user.first_name;
                                request.session.username = user.username;
                                sessionStore.set(request.session.id, request.session, function(){
                                    response.status(200).send("OK");
                                });
                            }
                        });
                    }
                }
            });
        }
    });
};

var logIn = function(request, response, sessionStore, username, password){
    connectionPool.getConnection((err, connection)=>{
        if(err){
            console.log("Could not get connection from pool");
        }
        else{
            let queryStr = "SELECT * FROM users WHERE username=? AND password=?;";
            connection.query(queryStr, [username, password], function(err,rows){
                connection.release();
                if(err){
                    response.status(500).send({message : "Internal database error."});
                }
                else{
                    if(rows.length != 0){
                        request.session.first_name = rows[0]["first_name"];
                        request.session.username = username;
                        sessionStore.set(request.session.id, request.session, function(){
                            response.status(200).send("OK");
                        });
                    }
                    else{
                        response.status(400).send({message : "User not found."});
                    }
                }
            });
        }
    });
};

var deleteAccount = function(request, response, session, sessionStore){
    connectionPool.getConnection((err, connection)=>{
        if(err){
            console.log("Could not get connection from pool");
        }
        else{
            let queryStr = "DELETE FROM users WHERE username=? ;";
            connection.query(queryStr, [request.session.username], function(err,rows){
                connection.release();
                if(err){
                    response.status(500).send({message : "Internal database error."});
                }
                else{ //a user has been deleted, let's kill their session too
                    sessionStore.destroy(request.session.id, (error)=>{ //kill the session
                        if(!error){
                            request.session.destroy((error)=>{
                                response.status(200).send("Account deleted and logged out");
                            });
                        }
                        else{
                            response.status(500).send("Failed to destroy session from store");
                        }
                    });
                }
            });
        }
    });
};

//Retrieve the user's id and call the callback function when you are done,
//inserting the result to a callbackParams object, using the same connection
var retrieveUserIdAndCallNext = function(callback, callbackParams, username){
    connectionPool.getConnection((err, connection)=>{
        if(err){
            console.log("Could not get connection from pool");
        }
        else{
            //first get the id of the user
            let queryStr = "SELECT id FROM users WHERE username=?";
            connection.query(queryStr, [username], function(err,rows){
                if(err){
                    connection.release();
                    console.log("retrieveUserIdAndCallNext error : ", err.code);
                    response.status(500).send({message : "Internal Server Error"});
                }
                else{
                    if(rows.length == 0){
                        connection.release();
                        console.log("retrieveUserIdAndCallNext : user not found");
                        response.status(500).send({message : "Internal Server Error"});
                    }
                    else{
                        //now call the next function
                        callbackParams.userID  = rows[0].id;    //add this parameter before calling the callback
                        callback(callbackParams, connection);
                    }
                }
            });
        }
    });
};

//Saves only the network without the nodes
var saveNetwork = function(params, connection){    
    let queryStr = "INSERT INTO Networks (user_id, name) VALUES (?,?);";
    let response = params.responseObj;
    connection.query(queryStr, [params.userID, params.netName], function(err){
        if(err){
            connection.release();
            console.log("Save network error1 : ", err.code);
            response.status(500).send({message : "Internal Server Error"});
        }
        else{
            queryStr = "SELECT MAX(id) AS netID FROM Networks;";
            connection.query(queryStr, function(err, rows){
                if(err){
                    console.log("Save network error2 : ", err.code);
                    response.status(500).send({message : "Internal Server Error"});
                }
                else{
                    if(rows.length == 0){
                        console.log("Couldn't retrieve network's id");
                        response.status(500).send({message : "Internal Server Error"});
                    }
                    else{
                        //Use the new network's id to call the next function
                        saveNetworkNodes(connection, response, rows[0].netID, params.network);
                    }
                }
            });
        }
    });
};

//stores the nodes and their data 
var saveNetworkNodes = function(connection, response, netID, network){
    let queryStr = "INSERT INTO nodes (network_id, node_id, neighbors, position_x, position_y) VALUES ?;";
    let values = [];
    let row = [];
    for(var i=0; i<network.nodes.length; i++){
        row = [];
        row.push(netID);
        row.push(network.nodes[i].id);
        let neighborsList = "[";
        for(var j=0; j<network.nodes[i].neighbors.length; j++){
            neighborsList += network.nodes[i].neighbors[j] + ",";
        }
        neighborsList += "]";
        row.push(neighborsList);
        row.push(network.nodes[i].position.x);
        row.push(network.nodes[i].position.y);
        values.push(row);
    }
    connection.query(queryStr, [values], (err)=>{
        connection.release();
        if(err){
            console.log("Error in saveNetworks", err.code);
            response.status(500).send({message : "Internal Server Error"});
        }
        else{
            response.status(200).send({message : "Data saved"});
        }
    });
};

var deleteNetwork = function(response, netID){
    connectionPool.getConnection((err, connection)=>{
        if(err){
            console.log("Could not get connection from pool");
        }
        else{
            let queryStr = "DELETE FROM Networks WHERE id=?";
            connection.query(queryStr, [netID], (err)=>{
                connection.release();
                if(err){
                    console.log("Error in deleteNetwork");
                    response.status(500).send({message : "Internal Server Error"});
                }
                else{
                    response.status(200).send({message : "Delete Complete"});
                }
            });
        }
    });
};

var loadNetwork = function(response, netID){
    connectionPool.getConnection((err, connection)=>{
        if(err){
            console.log("Could not get connection from pool");
        }
        else{
            let queryStr = "SELECT * FROM nodes WHERE network_id=?";
            connection.query(queryStr, [netID], (err, rows)=>{
                connection.release();
                if(err){
                    console.log("Error in loadNetwork");
                    response.status(500).send({message : "Internal Server Error"});
                }
                else{
                    var network = { nodes : []};
                    var Node = function(){
                        this.id = -1;
                        this.neighbors = [];
                        this.graphic = {}; //will be filled on client
                        this.position = {
                            x : 0,
                            y : 0
                        };
                    };
                    var node;
                    var success = true;
                    for(var i=0; i< rows.length; i++){
                        node = new Node();
                        node.id = rows[i].node_id;
                        let result = _parseNeighborsString(rows[i].neighbors);
                        if(result.state =="error"){
                            console.log("Load Network : Error in parsing neighbor data");
                            success = false;
                            response.status(500).send({message : "Internal Server Error"});
                        }
                        else{
                            node.neighbors = result.list;
                            node.position.x = rows[i].position_x;
                            node.position.y = rows[i].position_y;
                            network.nodes.push(node);
                        }
                    }
                    if(success){
                        response.status(200).send({data : network});
                    }
                }
            });
        }
    });
};

var retrieveUserNetworks = function(params, connection){
    let queryStr = "SELECT id, name FROM Networks WHERE user_id=?;";
    let response = params.responseObj;
    connection.query(queryStr, [params.userID], (err, rows)=>{
        connection.release();
        if(err){
            console.log("Error in retrieve networks ", err.code);
            response.status(500).send({message : "Internal Server Error"});
        }
        else{
            let nets = [];
            for(var i=0; i<rows.length; i++){
                nets.push({id : rows[i].id, name : rows[i].name});
            }
            response.status(200).send({data : nets});
        }
    });
};

//will take a string and parse a list of integers
//The neighbor list of a node is stored as a string
var _parseNeighborsString = function(textList){
    var result = {
        state : "begin",
        list : []
    };
    var numberTxt;
    for(var i=0; i<textList.length; i++){
        switch(textList[i]){
            case "[" : 
                if(result.state == "begin"){
                    result.state = "reading";
                    numberTxt = "";
                }
                else{ 
                    result.state = "error";
                    return result;
                };
                break;
            case "]":
                if(result.state == "reading"){
                    result.state = "end";
                }
                else{
                    result.state = "error";
                }
                return result;
            default :
                if(result.state == "reading"){
                    if(textList[i] != ","){
                        numberTxt += textList[i];
                    }
                    else{
                        let number = parseInt(numberTxt, 10);
                        if(isNaN(number)){
                            result.state = "error";
                            return result;
                        }
                        else{
                            numberTxt = ""; //reset
                            result.list.push(number);
                        }
                    }
                }
                else{
                    result.state = "error";
                    return result;
                }
        }
    }
    return result;
}

module.exports.signUp = signUp;
module.exports.logIn = logIn;
module.exports.deleteAccount = deleteAccount;
module.exports.retrieveUserIdAndCallNext = retrieveUserIdAndCallNext;
module.exports.saveNetwork = saveNetwork;
module.exports.deleteNetwork = deleteNetwork;
module.exports.loadNetwork = loadNetwork;
module.exports.retrieveUserNetworks = retrieveUserNetworks;