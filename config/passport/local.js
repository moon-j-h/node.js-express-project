/**
 * Created by Moon Jung Hyun on 2015-11-16.
 */

var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./../../models/Users');
var Blog = require('./../../models/Blogs');
var async = require('async');

module.exports = new LocalStrategy({
   usernameField : 'email',
    passwordField : 'password'
},
function(email, password, done){
    var options = {
        criteria : {email : email},
        select : '-email -name -provider -authToken -facebook -intro -phone -myArtists -createAt -updateAt -isPublic'
    };
    User.findUser(options, function(err, doc){
        if(err) done(err);
        if(!doc){
            return done(null, false, {message : '일치하는 정보가 없습니다.'});
        }
        if(!doc.authenticate(password)){
            return done(null, false, {message : '일치하는 정보가 없습니다.'});
        }
        Blog.findBlogIdOfUser(doc._id, function(err, blogIds){
            console.log('local.js 에서의 blogIds ', blogIds);
            var artistBlog;
            var spaceBlog = [];
            var activityBlog;
            async.each(blogIds, function(blogId, callback){
                if(blogId.type == 0){  // artistBlog
                    artistBlog = blogId._id;
                    console.log('artistBlog ', artistBlog);
                }else{   // spaceBlog
                    spaceBlog.push(blogId._id);
                    console.log('spaceBlog ', spaceBlog);
                }
                if(blogId.isActivated == true)
                    activityBlog = blogId._id;
                callback();
            }, function(err){
                if(err){
                    return done(null, false, {message : '서버 오류..'});
                }else{
                    var user = {
                        userKey : doc._id,
                        activityBlogKey : activityBlog,
                        artistBlogKey : artistBlog,
                        spaceBlogKeys : spaceBlog
                    };
                    console.log('user... ', user);
                    return done(null, user);
                }
            });
        });
    });
});