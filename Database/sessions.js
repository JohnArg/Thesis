/*
    This module will create a session and a sessionStore object available when 'required'
*/
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var secret = "i_solemnly_swear_that_i'm_up_to_no_good";
//configuration for the session store
var sessionStoreConfig={
    host     : 'localhost',
    port     : 3344,
    user     : 'adhoc',
    password : 'adhoced@!0091$',
    database : 'sessions',
    createDatabaseTable: true,  //let the app create the table,
    expiration: 180000,
    checkExpirationInterval: 300000,    //frequency of checking for expired sessions
    schema: {
        tableName: 'sessions_store',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}

//initialize the session object and export it
var sessionStore = new MySQLStore(sessionStoreConfig);
//configuration for the sessions
var sessionConfig ={
    store : sessionStore,
    secret: secret, 
    cookie : {
        MaxAge : 180000
    },
    resave:false, 
    saveUninitialized:false
}
module.exports.session = session;
module.exports.sessionConfig = sessionConfig;
module.exports.sessionStore = sessionStore;

