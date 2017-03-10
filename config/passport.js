/**
 * Created by Moon Jung Hyun on 2015-11-16.
 */

var mongoose = require('mongoose');
//var LocalStrategy = require('passport-local').Strategy;
var User = require('./../models/Users');

var local = require('./passport/local');
var facebook = require('./passport/facebook');

module.exports = function(passport){
    // session 저장
    passport.serializeUser(function(user, done){
        console.log('serializeUser ', user);
        done(null, user);
    });

    passport.deserializeUser(function(user, done){
        console.log('deserializeUser ', user);
        //User.findUser({criteria : {_id : id}}, function(err, user){
            done(null, user);
        //});
    });

    // 사용하는 strategy...
    passport.use(local);
    passport.use('facebook-token', facebook);
};