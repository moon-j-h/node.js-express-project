/**
 * Created by Moon Jung Hyun on 2015-11-07.
 */
var express = require('express');
var router = express.Router();

var WorkPost = require('./../controllers/WorkPosts');


router.post('/', WorkPost.addWorkPost);
router.get('/', WorkPost.getWorkPosts);

router.get('/hashTag', WorkPost.getPostsByHashTag);

router.get('/recommend', WorkPost.getRecommendWorkPosts);

router.get('/:postId', WorkPost.getWorkPost);

module.exports = router;