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
    that.signUp = function(user){
        var queryStr = "SELECT * FROM users WHERE username=?";
        that.connection.query(queryStr, [user.username], function(err, rows){
            if(err){
                console.log("Database query error : ", err.code);
                return "err";
            }
            else{
                if(rows.length != 0){
                    console.log("User already exists");
                    return "exists";
                }
                else{
                    queryStr = "INSERT INTO users (first_name, last_name, username, password) VALUES (?,?,?,?);";
                    that.connection.query(queryStr, [user.first_name, user.last_name, user.username, user.password], function(err){
                        if(err){
                            console.log("Database query error : ", err.code);
                            return false;
                        }
                        else{
                            return true;
                        }
                    });
                }
            }
        });
    };
    that.logIn = function(username, password){
        var queryStr = "SELECT * FROM users WHERE username=? AND password=?;";
        that.connection.query(queryStr, [username, password], function(err,rows){
            if(err){
                console.log("Database query error : ", err.code);
                return "err";
            }
            else{
                if(rows.length != 0){
                    console.log("user logged in!");
                    return rows[0];
                }
                else{
                    console.log("user not found");
                    return "fail";
                }
            }
        });
    }
}

module.exports.newQueryObject = dbFactory;