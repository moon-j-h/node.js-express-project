/**
 * Created by Moon Jung Hyun on 2015-11-09.
 */

var express = require('express');
var router = express.Router();
var ArtistBlog = require('./../controllers/ArtistBlogs');

var auth = require('./../config/middlewares/authorization');
var blogAuth = [auth.blog.hasAuthorization];


router.get('/:blogId/profilePhoto', ArtistBlog.getArtistBlogProfilePhoto);
router.put('/:blogId/profilePhoto', blogAuth, ArtistBlog.modifyArtistBlogProfilePhoto);


router.get('/:blogId/profile', ArtistBlog.getArtistBlogProfile);
router.put('/:blogId/profile', blogAuth, ArtistBlog.modifyArtistBlogProfile);

module.exports = router;
