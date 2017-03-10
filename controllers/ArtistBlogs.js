/**
 * Created by Moon Jung Hyun on 2015-11-08.
 */

var formidable = require('formidable'),
    pathUtil = require('path');

var async = require('async');
var randomstring = require('randomstring');

var uploadUrl = __dirname + '/../upload';
var defaultArtistProfileUrl = 'http://s3-ap-northeast-1.amazonaws.com/in-deepen/images/profile/icon-person.jpg';

var Blog = require('./../models/Blogs');
var User = require('./../models/Users');
var Helper = require('./Helper');

/**
 * 개인 블로그 프로필 사진 가져오기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.getArtistBlogProfilePhoto = function(req, res, next){
    var blogId = req.params.blogId;
    if(!blogId){
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(error);
    }
    Blog.findProfilePhotoOfBlog(blogId, function(err, doc){
        if(err){
            var error = new Error('프로필 사진을 가져올 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        var msg = {
            code : 200,
            msg : 'Success',
            result : doc
        };
        res.status(msg.code).json(msg);
    });
};

/**
 * 개인 블로그 프로필 가져오기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.getArtistBlogProfile = function(req, res, next){
    var blogId = req.params.blogId;
    if(!blogId){
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(error);
    }
    Blog.findProfileOfArtistBlog(blogId, function(err, doc){
        if(err){
            console.error('ERROR GETTING PROFILE OF ARTISTBLOG ', err);
           var error = new Error('profile 을 가져올 수 없습니다.');
           error.code = 400;
           return next(error);
        }
        console.log('profile ', doc);
        var info = {
            _id : doc._id,
            _user : doc._user._id,
            email : doc._user.email,
            name : doc._user.name,
            nick : doc._user.nick,
            phone : doc.phone,
            intro : doc.intro,
            isPublic : doc._user.isPublic
        };
        var msg = {
            code : 200,
            msg : 'Success',
            result : info
        };
        res.status(msg.code).json(msg);
    });
};

/**
 * 개인 블로그 프로필 수정하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.modifyArtistBlogProfile = function(req, res, next){
    var blogId = req.params.blogId;
    if(!blogId){
        var error = new Error('URL 확인 부탁합니다.');
        error.code = 400;
        return next(error);
    }
    var newInfo = {
        nick : req.body.nick,
        intro : req.body.intro,
        name : req.body.name,
        phone : req.body.phone,
        isPublic : req.body.isPublic,
        updateAt : new Date()
    };
    console.log('newInfo ', newInfo);

    Blog.updateProfileOfBlog(blogId, newInfo, function(err, doc){
        if(err){
            console.error('ERROR UPDATING PROFILE AT ARTISTBLOG ', err);
            var error = new Error('Blogs 쪽 update 실패 ㅠㅜ');
            error.code = 400;
            return next(error);
        }
        User.updateProfileAtArtistBlog(doc._user, newInfo, function(err, doc){
            if(err){
                console.error('ERROR UPDATING PROFILE AT USER ', err);
                var error = new Error('Users 쪽 update 실패 ㅠㅜ');
                error.code = 400;
                return next(error);
            }
            var msg = {
                code : 200,
                msg : 'Success'
            };
            res.status(msg.code).json(msg);
        });
    });
};

/**
 * 개인 블로그 프로필 사진 수정하기
 * @param req
 * @param res
 * @param next
 */
module.exports.modifyArtistBlogProfilePhoto = function(req, res, next){
    var blogId = req.params.blogId;
    if(!blogId){
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(errpr);
    }
    async.waterfall(
        [
            function(callback){
                var form = new formidable.IncomingForm();
                form.encoding ='utf-8';
                form.uploadDir = uploadUrl;
                form.keepExtensions = true;
                form.parse(req, function(err, fields, files){
                    if(err){
                        return callback(err, null);
                    }
                    var file = files.file;
                    callback(null, file);
                });
            },
            function(file, callback){
                if(file == null){
                    console.log('not file');
                    callback(null, defaultArtistProfileUrl);
                }else {
                    var randomStr = randomstring.generate(10);
                    var newFileName = 'profile_' + randomStr;
                    var extName = pathUtil.extname(file.name);
                    Helper.uploadFile(file, newFileName,extName, 'images/profiles/', function(err, fileUrl){
                        if(err){
                            console.error('ERROR @ FILE UPLOAD ', err);
                            callback(err);
                        }
                        else{
                            console.log('fileUrl ', fileUrl);
                            callback(null, fileUrl.originalPath);
                        }
                    });
                }
            },
            function(url, callback){
                Blog.updateProfilePhotoOfBlog(blogId, url, function(err, doc){
                    if(err){
                        console.error('ERROR UPDATING PROFILE PHOTO AT ARTIST BLOG ', err);
                        var error = new Error('Blog Profile 사진을 변경하는데 실패했습니다.');
                        error.code = 500;
                        return next(error);
                    }
                    console.log('doc ', doc);
                    User.updateProfilePhoto(doc._user, url, function(err, doc){
                        if(err){
                            console.error('ERROR UPDATING PROFILE PHOTO OF USER ', err);
                            var error = new Error('User Profile 사진을 변경하는데 실패했습니다.');
                            error.code=  500;
                            return next(error);
                        }
                        callback();
                    });
                });
            }
        ],
        function(err){
            if(err){
                res.sendStatus(500);
            }else{
                var msg = {
                    code : 200,
                    msg : 'Success'
                };
                res.status(msg.code).json(msg);
            }
        }
    )
};