/**
 * Created by Moon Jung Hyun on 2015-11-25.
 */

var Blog = require('./../models/Blogs');
module.exports.showAddWorkPostPage = function(req, res){
    Blog.findAllBlogsNick(function(err,docs){
        if(err){
            console.error(err);
            var err = new Error("err");
            //error처리
            return next(err);
        }
        console.log(docs);
        res.render('workAddForm',{blogs : docs});
    });
};

var formidable = require('formidable'),
    pathUtil = require('path');
var async = require('async');
var randomstring = require('randomstring');
var uploadUrl = __dirname + '/../upload';
var Post = require('./../models/Posts');
var Helper = require('./Helper');
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
                    callback(null, uploadInfo.workType, uploadInfo.emotion, uploadInfo.blogId, uploadInfo.content, fileUrls);
                });
            },
            function (workType, emotion, blogId, content, urls, callback) {
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
                    resources : urls
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
                res.redirect('/web/page/addWorkPost');
            }
        });
};

/**
 * 회원 보기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */

module.exports.showAllUsers = function (req,res,next){
    Blog.findAllBlogs(function(err,docs){
        if(err){
            console.error(err);
            var error = new Error('모든 유저를 가져올 수 없다!');
            error.code = 404;
            return next(error);
        }
        console.log('users ', docs);
        res.render('allUsers', {users : docs});
    });
};