/**
 * Created by Moon Jung Hyun on 2015-11-25.
 */

var FacebookTokenStrategy = require('passport-facebook-token');
var fbConfig  = require('./../fbConfig');
var User = require('./../../models/Users');
var Blog = require('./../../models/Blogs');

module.exports = new FacebookTokenStrategy(
    {
        clientID : fbConfig.clientID,
        clientSecret : fbConfig.clientSecret,
        profileFields : ['id', 'displayName', 'photos', 'email']
    },
    function(accessToken, refreshToken, profile, done){
        console.log('accessToken : '+accessToken + " refreshToken : "+refreshToken);
        console.log('profile : ', profile);
        // user 등록 or 찾기
        var options = {
            criteria : {email : profile.email},
            select : '-email -name -provider -authToken -facebook -intro -phone -myArtists -createAt -updateAt -isPublic'
        };
        User.findUser(options, function(err, doc){
            if(err){
                done(err);
            }
            if(!doc){
                // 새로 등록
                var userInfo = {
                    email : profile.emails[0].value,
                    name : profile.displayName,
                    nick : profile.displayName,
                    provider : 'facebook',
                    authToken : accessToken,
                    profilePhoto : profile.photos[0].value
                };
                User.saveUser(userInfo, function(err, doc){
                    if(err){
                        done(err);
                    }else{
                        console.log('new User from facebook', doc);
                        Blog.findBlogIdOfUser(doc._id, function(err, blogIds){
                            console.log('facebook.js 에서의 blogIds ', blogIds);
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
                                    console.log('user... @ facebook ', user);
                                    return done(null, user);
                                }
                            });
                        });
                    }
                });
            }
            Blog.findBlogIdOfUser(doc._id, function(err, blogIds){
                console.log('facebook.js 에서의 blogIds ', blogIds);
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
                        console.log('user... @ facebook ', user);
                        return done(null, user);
                    }
                });
            });
        });
    }
);