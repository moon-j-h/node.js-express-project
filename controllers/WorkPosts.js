/**
 * Created by Moon Jung Hyun on 2015-11-07.
 */

var userKey = '564a926a29c7cf6416be1117'; // session에 있을 정보
//var blogKey = '564a926b29c7cf6416be1118'; // session에 있을 정보

var formidable = require('formidable'),
    pathUtil = require('path');
var async = require('async');
var randomstring = require('randomstring');
var uploadUrl = __dirname + '/../upload';

var User = require('./../models/Users');
var Comment = require('./../models/Comments');
var Post = require('./../models/Posts');
var Helper = require('./Helper');

/**
 * 예술 Post 저장하기
 * @param req
 * @param res
 * @param next
 */
module.exports.addWorkPost = function(req, res, next){
    async.waterfall(
        [
            function (callback) {
                var uploadInfo = {
                    files: []
                };
                var form = new formidable.IncomingForm();
                form.uploadDir = uploadUrl;
                form.encoding ='utf-8';
                form.keepExtensions = true;
                form
                    .on('field', function (field, value) {
                        console.log('file 아님 ', field);
                        uploadInfo[field] = value;
                    })
                    .on('file', function (field, file) {
                        if (field == 'file') {
                            uploadInfo.files.push(file);
                        } else {
                            console.log('file 임 ', field);
                            uploadInfo[field] = file;
                        }
                    })
                    .on('end', function () {
                        console.log('-> upload done');
                        callback(null, uploadInfo);
                    });
                form.parse(req);
            },
            function (uploadInfo, callback) {
                console.log('uploadInfo', uploadInfo);
                var fileUrls = [];
                var order = 0;
                var randomStr = randomstring.generate(10); // 10자리 랜덤
                async.each(uploadInfo.files, function(file, callback){
                    var newFileName = 'content_'+ randomStr+'_' + (order++) ;
                    var extName = pathUtil.extname(file.name);
                    var contentType = file.type;
                    var isImageExist = contentType.indexOf('image');

                    if(isImageExist != -1){
                        Helper.uploadImageAndThumbnail(file, newFileName, extName, 'contents/images/', function(err, fileUrl){
                            if(err){
                                console.error('uploadImageAndThumbnail error ', err);
                                callback(err);
                            }else{
                                console.log('uploadImageAndThumbnail fileUrl '+order, fileUrl);
                                fileUrls.push(fileUrl);
                                callback();
                            }
                        });
                    }else{
                        Helper.uploadFile(file, newFileName, extName, 'contents/music/', function(err, fileUrl){
                            if(err){
                                console.error('uploadAudio error', err);
                                callback(err);
                            }else{
                                console.log('uploadAudio '+order, fileUrl);
                                fileUrls.push(fileUrl);
                                callback();
                            }
                        });
                    }
                }, function(err){
                    if(err){
                        var error = new Error('파일에서 실패...');
                        error.code = 400;
                        return next(error);
                    }
                    console.log('before ', fileUrls);
                    fileUrls.sort(function(a, b){
                        if(a.originalPath < b.originalPath)
                            return -1;
                        else if(a.originalPath > b.originalPath)
                            return 1;
                        else
                            return 0;
                    });
                    console.log('after ', fileUrls);
                    callback(null, uploadInfo.workType, uploadInfo.emotion, uploadInfo.blogId, uploadInfo.content, uploadInfo.youTube, fileUrls);
                });
                /*async.eachSeries(uploadInfo.files, function(file, callback){
                    var newFileName = 'content_'+ randomStr+'_' + (order++) ;
                    var extName = pathUtil.extname(file.name);
                    var contentType = file.type;
                    var isImageExist = contentType.indexOf('image');

                    if(isImageExist != -1){
                        Helper.uploadImageAndThumbnail(file, newFileName, extName, 'contents/images/', function(err, fileUrl){
                            if(err){
                                console.error('uploadImageAndThumbnail error ', err);
                                callback(err);
                            }else{
                                console.log('uploadImageAndThumbnail fileUrl '+order, fileUrl);
                                fileUrls.push(fileUrl);
                                callback();
                            }
                        });
                    }else{
                        Helper.uploadFile(file, newFileName, extName, 'contents/music/', function(err, fileUrl){
                            if(err){
                                console.error('uploadAudio error', err);
                                callback(err);
                            }else{
                                console.log('uploadAudio '+order, fileUrl);
                                fileUrls.push(fileUrl);
                                callback();
                            }
                        });
                    }
                }, function done(){

                    console.log('before ', fileUrls);
                    fileUrls.sort(function(a, b){
                        if(a.originalPath < b.originalPath)
                            return -1;
                        else if(a.originalPath > b.originalPath)
                            return 1;
                        else
                            return 0;
                    });
                    console.log('after ', fileUrls);
                    callback(null, uploadInfo.workType, uploadInfo.emotion, uploadInfo.blogId, uploadInfo.content, uploadInfo.youTube, fileUrls);
                });*/
            },
            function (workType, emotion, blogId, content, youTube, urls, callback) {
                // hash_tag 추출
                var tmpStr = content.split('#');
                var hashTag = [];
                for(var i=1; i<tmpStr.length; i++){
                    var tmp = tmpStr[i].split(' ')[0];
                    if(tmp != '')
                        hashTag.push(tmp);
                }
                // db 저장
                var postInfo = {
                    postType : 0,
                    _writer : blogId,
                    content : content,
                    hashTags : hashTag,
                    likes : [],
                    work : {
                        type : workType,
                        emotion : emotion
                    },
                    resources : urls,
                    youTube : youTube
                };
                Post.savePost(postInfo, function(err, doc){
                    if(err){
                        console.error('Error', err);
                        var error = new Error('포스팅 실패');
                        error.code = 400;
                        next(error);
                    }else{
                        console.log('Done Save POst ', doc);
                        callback();
                    }
                });
            }
        ],
        function (err) {
            if (err) {
                res.sendStatus(500);
            }
            else {
                // app..

                var msg = {
                    code : 200,
                    msg : 'Success'
                };
                res.status(msg.code).json(msg);

                //res.redirect('/workPosts/page');
            }
        });
};

/**
 * 예술 Post List 가져오기
 * @param req
 * @param res
 * @param next
 */
module.exports.getWorkPosts = function(req, res, next){
    var works = [];
    var workPost = new Post({postType : 0});
    workPost.findByPostType(function(err, workPosts){
        if(err) {
            console.error('ERROR GETTING WORK POSTS', err);
            var error = new Error('Work Post를 가져올 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        var order = 0;
        async.each(workPosts, function(workPost, callback){
            var tmp = {
                seq : (order++),
                postInfo : workPost
            };
            Comment.countCommentsOfPost(workPost._id, function(err, count){
                if(err){
                    console.error('ERROR COUNT COMMENTS ', err);
                    var error = new Error('댓글 개수를 셀 수 없습니다.');
                    error.code = 400;
                    return next(error);
                }
                tmp['commentCnt'] = count;
                Comment.findLast2Comments(workPost._id, function(err, docs){
                    if(err){
                        console.error('ERROR FIND LAST 2 COMMENTS ', err);
                        var error = new Error('최신 댓글 2개를 가져오는데 실패했습니다.');
                        error.code = 400;
                        return next(error);
                    }
                    tmp['comments'] = docs.reverse();
                    //console.log('final workPost ', tmp);
                    works.push(tmp);
                    callback();
                });
            });
        }, function (err){
            if(err){
                var error = new Error('async error');
                error.code = 400;
                return next(error);
            }
            works.sort(function(a, b){
                return a.seq - b.seq;
            });
             var msg = {
                 code : 200,
                 msg : 'Success',
                 result : works
             };
             res.status(msg.code).json(msg);

            //res.render('post', {works : works});
        });
    });
};

/**
 * 해당 예술 Post의 상세정보 가져오기
 * @param req
 * @param res
 * @param next
 */
module.exports.getWorkPost = function(req, res, next){
    var id = req.params.postId;
    var workPost = {};
    Post.findPost(id, 0, function(err, doc){
        if(err){
            console.error('ERROR GETTING POST ', err);
            var error = new Error('해당 post를 찾을 수 없습니다.');
            error.code = 404;
            return next(error);
        }
        console.log('doc ', doc);
        workPost['postInfo'] = doc;
        Comment.countCommentsOfPost(id, function(err, count){
            console.log('count ', count);
            workPost['commentCnt'] = count;
            console.log('workPost ', workPost);
            var msg = {
                code : 200,
                msg : 'Success',
                result : workPost
            };
            res.status(msg.code).json(msg);
        });
    });
};

/**
 * hash tag로 검색해서 post 목록 가져오기
 * type : 0 (그림 하나 리스트), 1(그림 하나 -> post 리스트로), 2( post 리스트 더 불러오기)
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.getPostsByHashTag = function(req, res, next){
    var key = req.query.key;
    var type = req.query.type;
    var isStart = req.query.isStart;
    if(!key || !type){
        var error = new Error('key 와 type 을 주세요.');
        error.code = 400;
        return next(error);
    }
    var lastSeen;
    if(isStart)
        lastSeen = null;
    else
        lastSeen = req.session['hashTag'];
    Post.findPostsByHashTag(key, type, lastSeen, function(err, docs){
        if(err){
            console.error('ERROR GETTING POSTS BY HASH TAG ', err);
            var error = new Error('Hash Tag 로 가져오기 실패');
            error.code = 400;
            return next(error);
        }
        console.log('docs ', docs);
        if(docs.length != 0){
            if(type == 0){
                Helper.findWorkPostsVerOnePictureList(req, res, 'hashTag', docs);
            }else{
                Helper.findPostsVerPostList(req, res, type, 'hashTag', docs);
            }
        }else{
            var error =new Error('더 이상 없음');
            error.code = 404;
            return next(error);
        }

    });
};

/**
 * 추천 work posts 가져오기
 * @param req
 * @param res
 * @param next
 */
module.exports.getRecommendWorkPosts = function(req, res, next){
    // 1. myArtists 를 가져온다.
    //var key = req.user.userKey;
    //console.log('userKey ', key);
    var isStart = req.query.isStart;
    var type = req.query.type;
    var lastSeen = null;
    var sessionId = 'recommend';
    if(!isStart){
        lastSeen = req.session[sessionId];
    }
    User.findMyArtistIds(req.user.userKey, function(err, doc){
        if(err){
            console.error('ERROR GETTING MY ARTISTS ', err);
            var error = new Error('myArtists 를 가져올 수 없음');
            error.code = 400;
            return next(error);
        }
        console.log('doc ', doc);
        var blogIds = [];
        blogIds.push(req.user.artistBlogKey);
        req.user.spaceBlogKeys.forEach(function(space){
            blogIds.push(space);
        });
        console.log('blogIds', blogIds);
        Post.findRecommendWorkPosts(blogIds,doc.myArtists, type, lastSeen, function(err, docs){
            if(docs.length != 0){
                if(type == 0)
                    Helper.findWorkPostsVerOnePictureList(req, res, sessionId, docs);
                else
                    Helper.findPostsVerPostList(req, res, type, sessionId, docs);
            }else{
                var error = new Error('더 이상 없음');
                error.code = 404;
                return next(error);
            }
        });
    });
};