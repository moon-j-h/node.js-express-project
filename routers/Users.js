/**
 * Created by Moon Jung Hyun on 2015-11-14.
 */

var express = require('express');
var router = express.Router();
var User = require('./../controllers/Users');

var auth = require('./../config/middlewares/authorization');
var userAuth = [auth.requiresLogin];
var pwAuth = [auth.requiresLogin, auth.user.hasAuthorization];

router.post('/', User.join);

router.post('/emailCheck', User.checkEmail);

router.put('/pw', pwAuth, User.changePw);

router.get('/info', userAuth, User.getUserInfo);

router.put('/activityMode', userAuth, User.changeActivityMode);



module.exports = router;