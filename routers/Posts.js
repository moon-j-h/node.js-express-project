/**
 * Created by Moon Jung Hyun on 2015-11-04.
 */

var express= require('express');
var router = express.Router();

var Post = require('../controllers/Posts.js');
var auth = require('./../config/middlewares/authorization').post;

//var postAuth = [auth.post.hasAuthorization];
var likeAuth  = [ /*auth.whoIsWriter,*/ auth.hasAlreadyLiked];
router.get('/', Post.getPosts);


router.delete('/:postId', auth.hasAuthorization, Post.deletePost);


router.post('/:postId/reports', auth.whoIsWriter, Post.reportPost);

router.get('/:postId/comments', Post.getComments);
router.post('/:postId/comments', Post.addComment);

router.put('/:postId/:likeStatus', likeAuth, Post.changeLike);

module.exports = router;

