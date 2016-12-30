var mysql = require('mysql');
var dbConfig={
  host     : 'localhost',
  port     : 3344,
  user     : 'adhoc',
  password : 'adhoced@!0091$',
  database : 'adhoced'
};

var sessionConfig={
    host     : 'localhost',
    port     : 3344,
    user     : 'adhoc',
    password : 'adhoced@!0091$',
    database : 'adhoced',
    createDatabaseTable: false,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'sid',
            expires: 'expires',
            data: 'session'
        }
    }
}

var dbFactory = function(){
    return new dbConnection();
}

var dbConnection = function(){
    var that = this;
    that.connection = mysql.createConnection(dbConfig);
    that.signUp = function(request, response, user){
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
                            response.status(200).send("OK");
                        }
                    });
                }
            }
        });
    };
    that.logIn = function(request, response, username, password){
        let queryStr = "SELECT * FROM users WHERE username=? AND password=?;";
        that.connection.query(queryStr, [username, password], function(err,rows){
            if(err){
                response.status(500).send({message : "Internal database error."});
            }
            else{
                if(rows.length != 0){
                    request.session.first_name = rows[0]["first_name"];
                    request.session.username = username;
                    console.log(request.session.first_name, request.session.username);
                    response.status(200).send("OK");
                }
                else{
                    response.status(400).send({message : "User not found."});
                }
            }
        });
    };
}

module.exports.newQueryObject = dbFactory;
module.exports.dbConfig = dbConfig;