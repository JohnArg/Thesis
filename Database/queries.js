var mysql = require('mysql');
var dbConfig={
  host     : 'localhost',
  port     : 3344,
  user     : 'adhoc',
  password : 'adhoced@!0091$',
  database : 'adhoced'
};

var dbFactory = function(){
    return new dbConnection();
}

var dbConnection = function(){
    var that = this;
    that.connection = mysql.createConnection(dbConfig);
    that.signUp = function(request, response, sessionStore, user){
        //First check if the user already exists
        let queryStr = "SELECT * FROM users WHERE username=?";
        that.connection.query(queryStr, [user.username], function(err, rows){
            if(err){
                response.status(500).send({message : "Internal database error."});
            }
            else{
                if(rows.length != 0){
                    response.status(400).send({message : "User already exists."});
                }
                else{
                    //If the user doesn't already exist insert the data to the database
                    let queryStr = "INSERT INTO users (first_name, last_name, username, password) VALUES (?,?,?,?);";
                    that.connection.query(queryStr, [user.first_name, user.last_name, user.username, user.password], function(err){
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
    };
    that.logIn = function(request, response, sessionStore, username, password){
        let queryStr = "SELECT * FROM users WHERE username=? AND password=?;";
        that.connection.query(queryStr, [username, password], function(err,rows){
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
    };
    that.deleteAccount = function(request, response, session, sessionStore){
        let queryStr = "DELETE FROM users WHERE username=? ;";
        that.connection.query(queryStr, [request.session.username], function(err,rows){
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
    };
    //Use this to save the network data of a user.
    that.saveNetworkData = function(response, username, netName, network){
        //first get the id of the user
        let queryStr = "SELECT id FROM users WHERE username=?";
        that.connection.query(queryStr, [username], function(err,rows){
            if(err){
                console.log("Save network data error : ", err.code);
                response.status(500).send({message : "Internal Server Error"});
            }
            else{
                if(rows.length == 0){
                    console.log("Save network data : user not found");
                    response.status(500).send({message : "Internal Server Error"});
                }
                else{
                    //now call the next function
                    console.log("User id : ", rows[0]);
                    that.saveNetwork(response, rows[0].id, netName, network);
                }
            }
        });
    };
    //Saves only the network without the nodes
    that.saveNetwork = function(response, userID, netName, network){    
        let queryStr = "INSERT INTO Networks (user_id, name) VALUES (?,?);";
        console.log("User id : "+ userID+" netName : "+netName);
        that.connection.query(queryStr, [userID, netName], function(err){
            if(err){
                console.log("Save network error1 : ", err.code);
                console.log(err.code);
                response.status(500).send({message : "Internal Server Error"});
            }
            else{
                queryStr = "SELECT MAX(id) AS netID FROM Networks;";
                that.connection.query(queryStr, function(err, rows){
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
                            console.log(rows[0]);
                            //Use the new network's id to call the next function
                            that.saveNetworkNodes(response, rows[0].netID, network);
                        }
                    }
                });
            }
        });
    };
    //stores the nodes and their data 
    that.saveNetworkNodes = function(response, netID, network){
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
            console.log(row);
            values.push(row);
        }
        that.connection.query(queryStr, [values], (err)=>{
            if(err){
                console.log("Error in saveNetworks", err.code);
                response.status(500).send({message : "Internal Server Error"});
            }
            else{
                response.status(200).send({message : "Data saved"});
            }
        });
    };
    that.deleteNetwork = function(response, netID){
        let queryStr = "DELETE FROM Networks WHERE id=?";
        that.connection.query(queryStr, [netID], (err)=>{
            if(err){
                console.log("Error in deleteNetwork");
                response.status(500).send({message : "Internal Server Error"});
            }
            else{
                response.status(200).send({message : "Delete Complete"});
            }
        });
    };
    that.loadNetwork = function(response, netID){
        let queryStr = "SELECT * FROM nodes WHERE network_id=?";
        that.connection.query(queryStr, [netID], (err, rows)=>{
            if(err){
                console.log("Error in loadNetwork");
                response.status(500).send({message : "Internal Server Error"});
            }
            else{
                var network = { nodes : []};
                var Node = function (id_in, neighbors, graphic){
                    this.id = id_in;
                    this.neighbors = neighbors;
                    this.graphic = {}; //will be filled on client
                    this.position = {
                        x : 0,
                        y : 0
                    }
                }
                var node;
                for(var i=0; i< rows.length; i++){
                    node = new Node(rows[i].);
                }
                response.status(200).send({data : network});
            }
        });
    }
}

//will take a string and parse a list of integers
var _parseNeighborsString = function(textList){
    
}

module.exports.newQueryObject = dbFactory;
module.exports.dbConfig = dbConfig;