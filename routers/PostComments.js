/**
 * Created by Moon Jung Hyun on 2015-11-07.
 */

var express = require('express');
var router = express.Router();
var PostComment = require('./../controllers/PostComments');

var commentAuth = require('./../config/middlewares/authorization').comment;

router.delete('/:commentId', commentAuth.hasAuthorization, PostComment.deleteComment);

module.exports = router;
