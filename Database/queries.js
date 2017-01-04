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
}

module.exports.newQueryObject = dbFactory;
module.exports.dbConfig = dbConfig;