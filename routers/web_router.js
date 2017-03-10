/**
 * Created by heuneul on 2015-11-03.
 */
var express = require('express');
var router = express.Router();
var fs = require('fs');
//var reply = require('../controllers/Reply.js');
var path = __dirname+'/../views';
var showPost = require('./../controllers/ShowPosts');

var webC = require('./../controllers/web_controller');
// menu(home)
router.get('/', function(req, res){
    fs.createReadStream(path+'/menu.html').pipe(res);
});

router.get('/login', function(req, res){
    fs.createReadStream(path+'/login.html').pipe(res);
});

router.get('/join', function(req, res){
    fs.createReadStream(path+'/join.html').pipe(res);
});

router.get('/web/showAll', webC.showAllUsers);

router.get('/web/page/addWorkPost', webC.showAddWorkPostPage);
router.post('/web/WorkPost', webC.addWorkPost);
//
//// reply
//router.get('/reply/:post_id', reply.findReplies)
//    .post('/reply/:post_id', reply.addReply);


module.exports = router;