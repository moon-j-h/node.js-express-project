/**
 * Created by Moon Jung Hyun on 2015-11-12.
 */
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var sessionStoreOptions = {
    url : 'mongodb://localhost:3000/session'
};

var sessionOptions = {
    secret : 'Secret Key',
    resave : false,
    saveUninitialized : false,
    store : new MongoStore(sessionStoreOptions)
};

module.exports = sessionOptions;