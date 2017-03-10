/**
 * Created by Moon Jung Hyun on 2015-11-09.
 */

var express = require('express');
var router = express.Router();
var Blog = require('./../controllers/Blogs');

var auth = require('./../config/middlewares/authorization').blog;

var BlogAuth = [auth.whoIsOwner, auth.hasAlreadyDone];

router.get('/:blogId', Blog.getBlogInfo);

router.put('/:blogId/bg', auth.hasAuthorization, Blog.modifyBgOfBlog);

router.get('/:blogId/myFans', Blog.getFansOfBlog);
router.get('/:blogId/myArtists', Blog.getArtistsOfBlog);

router.get('/:blogId/iMissYous', Blog.getiMissYous);
router.post('/:blogId/iMissYous', BlogAuth, Blog.addiMissYou);

router.get('/:blogId/myWorks', Blog.getWorkPostsOfBlogger);
router.get('/:blogId/myLikes', Blog.getLikePostsOfBlogger);
router.get('/:blogId/myShows', Blog.getMyShows);

// 이 router 는 무조건 마지막에 있어야 함....
router.put('/:blogId/:fanStatus', BlogAuth, Blog.changeFanOfBlog);

module.exports = router;
