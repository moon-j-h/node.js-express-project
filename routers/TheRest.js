/**
 * Created by Moon Jung Hyun on 2015-11-16.
 */
var express = require('express');
var TheRest = require('./../controllers/TheRest');
//var auth = require('./../config/middlewares/authorization');

module.exports = function(app, passport){
    app.post('/login',
        function(req, res) {
            passport.authenticate('local', function(err, user, msg, statusCode) {
                if ( ! user ) {
                    var msg = {
                        code : 401,
                        msg : msg.message
                    };
                    res.status(msg.code).json(msg);
                }else{
                    // 세션에 기록
                    req.logIn(user, function(err) {
                        if ( err ) {
                            res.status(401).json({code : 401, msg:'Session Write Error'});
                            return;
                        }
                        var msg = {
                            code : 200,
                            msg : 'Success',
                            result : user
                        };
                        console.log('msg ', msg);
                        res.status(msg.code).json(msg);
                    });
                }
            })(req);
        });


    app.get('/logout', TheRest.logout);

    app.post('/auth/facebook/token', function(req, res, next){
        passport.authenticate('facebook-token', function(err, user, msg, status){
            console.log('user : ', user, ' msg : ', msg, ' status : ', status );
            req.logIn(user, function(err){
                if(err){
                    console.error('ERROR @ req.logIn ', err);
                    var error = new Error('로스인 실패');
                    error.code = 401;
                    return next(error);
                }
                var msg = {
                    code : 200,
                    msg : '로그인 성공',
                    result : user
                };
                res.status(msg.code).json(msg);
            });
        });
    });
};