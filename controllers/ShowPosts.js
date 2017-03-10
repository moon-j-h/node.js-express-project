/**
 * Created by heroKoo on 2015-11-08.
 */

var formidable = require('formidable'),
    pathUtil = require('path');
var fs = require('fs');
var async = require('async');
var randomstring = require('randomstring');
var AWS = require('aws-sdk');

var awsS3 = require('./../config/s3');
AWS.config.region = awsS3.region;
AWS.config.accessKeyId = awsS3.accessKeyId;
AWS.config.secretAccessKey = awsS3.secretAccessKey;

// Listup All Files
var s3 = new AWS.S3();
var bucketName = awsS3.bucketName;
var uploadUrl = __dirname + './../upload';

var Comment = require('./../models/Comments');
var Post = require('./../models/Posts');
var Blog = require('./../models/Blogs');
var Helper = require('./Helper.js');
var Noti = require('./Notis');

//add_form
module.exports.getShowAddForm = function (req, res, next) {
    Blog.findAllBlogsNick(function (err, docs) {
        if (err) {
            console.error(err);
            var err = new Error("err");
            //error처리
            return next(err);
        }
        console.log(docs);
        res.render('showForm', {blogs: docs});

    });
};

//List
module.exports.getShowList = function (req, res, next) {
    var showPageSession = "showPageSession";
    var isStart = req.query.isStart;
    var region = req.query.region;
    var field = req.query.field;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    //console.log('reqgion : ',region);
    //console.log('field : ',field);
    //console.log('startDate : ',startDate);
    //console.log('endDate : ',endDate);

    var lastSeen = null;

    //isStart가 null
    if (!isStart) {
        lastSeen = req.session[showPageSession];
    }
    console.log('session : ',req.session);

    var showList = [];

    Post.hell(region, startDate, endDate, field, lastSeen, function (err, shows) {
        if (err) {
            console.error(err);
            var error = new Error('Show List 를 가져올 수 없다');
            error.code = 400;
            return next(error);
        }//if-err
        var order = 0;

        async.each(shows, function (showModel, callback) {
            var result = {
                seq: (order++),
                postInfo: showModel
            };

            //resource 한개만 가져오기
            result.postInfo['resources'] = result.postInfo.resources[0];

            Comment.countCommentsOfPost(showModel._id, function (err, count) {
                if (err) {
                    console.error('CANT COUNT DATGUL', err);
                    var error = new Error('countComment Error');
                    error.code = 400;
                    return next(error);
                }
                result['commentCnt'] = count;
                //console.log('result, :', result);
                showList.push(result);
                callback();
            });//countCommentsOfPost

        }, function (err) {
            if (err) {
                var error = new Error('글이 없습니다.');
                error.code = 404;
                return next(error);
            }
            showList.sort(function (a, b) {
                return a.seq - b.seq;
            });
            //마지막 게시물의 id값
            //console.log(showList.slice(-1)[0].postInfo._id);
            //console.log(showList.length);
            if (showList.length != 0) {
                req.session[showPageSession] = showList.slice(-1)[0].postInfo._id;
                var msg = {
                    code: 200,
                    msg: 'Success',
                    result: showList
                };
                res.status(msg.code).json(msg);
            } else {
                var error = new Error('게시물이 더 이상 없어요!');
                error.code = 404;
                return next(error);
            }
        });//async.each

    });//findPostType
//post결과와 comment수 결과를 담을 객체 생성
};//getShowList

//detail
module.exports.getShowPost = function (req, res, next) {
    var id = req.params.postId;
    var showPost = {};
    Post.findPost(id, 1, function (err, doc) {
        if (err) {
            console.error('error message : ', err);
            var error = new Error('포스트없슴')
            error.code = 404;
            return next(error);
        }
        //console.log(doc);
        showPost['postInfo'] = doc;
        Comment.countCommentsOfPost(id, function (err, count) {
            showPost['commentCnt'] = count;
            var msg = {
                code: 200,
                msg: 'Success',
                result: showPost
            };
            res.status(msg.code).json(msg);
            //console.log(msg);
            //fs.writeFile('/showPost.json', JSON.stringify(msg, null, 4), function(err) {
            //    if(err) {
            //        console.log(err);
            //    } else {
            //        console.log("JSON saved ");
            //    }
            //});

        });
    });//findPost
};

//문화컨텐츠 추가 POST
module.exports.addShowPost = function (req, res, next) {
    async.waterfall(
        [
            function (callback) {
                var uploadInfo = {
                    files: [],
                    tagArtists: []
                };
                var form = new formidable.IncomingForm();
                // aws 에 저장되는 경로....
                form.uploadDir = uploadUrl;
                form.encoding = 'utf-8';
                form.keepExtensions = true;
                form
                    .on('field', function (field, value) {
                        if (field == 'artist') {
                            var artist = {
                                _user: value
                            };
                            uploadInfo.tagArtists.push(artist);
                        } else if (field == 'tag') {
                            uploadInfo.tagArtists.push(JSON.parse(value));
                        } else {
                            console.log('file 아님 ', field);
                            uploadInfo[field] = value;
                        }
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
                async.each(uploadInfo.files, function (file, callback) {
                    var newFileName = 'content_' + randomStr + '_' + (order++);
                    var extName = pathUtil.extname(file.name);

                    Helper.uploadImageAndThumbnail(file, newFileName, extName, 'contents/images/', function (err, fileUrl) {
                        if (err) {
                            console.error('Helper.uploadImageAndThumbnail error', err);
                            callback(err);
                        } else {
                            console.log('Helper.uploadImageAndThumbnail fileUrl' + order, fileUrl);
                            fileUrls.push(fileUrl);
                            callback();
                        }
                    });
                    //

                }, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        //console.log('before',imageUrls);
                        fileUrls.sort(function (a, b) {
                            if (a.originalPath < b.originalPath)
                                return -1;
                            else if (a.originalPath > b.originalPath)
                                return 1;
                            else
                                return 0;
                        });
                        console.log('after fileUrls ', fileUrls);
                        callback(null, uploadInfo.showType, uploadInfo.title, uploadInfo.startDate, uploadInfo.endDate,
                            uploadInfo.startTime, uploadInfo.endTime, uploadInfo.fee, uploadInfo.blogId,
                            uploadInfo.content, uploadInfo.latitude, uploadInfo.longitude, uploadInfo.address,
                            uploadInfo.tagArtists, fileUrls);
                    }
                });//asyncEach

            },
            function (showType, title, startDate, endDate, startTime, endTime, fee,
                      blogId, content, latitude, longitude, address, tagArtists, urls, callback) {

                // db 저장
                var postInfo = {
                    postType: 1,
                    _writer: blogId,
                    content: content,
                    likes: [],
                    show: {
                        title: title,
                        type: showType,
                        tags: tagArtists,
                        startDate: startDate,
                        endDate: endDate,
                        startTime: startTime,
                        endTime: endTime,
                        fee: fee,
                        location: {
                            point: {
                                coordinates: [latitude, longitude]
                            },
                            address: address
                        }//loc
                    },
                    resources: urls
                };
                Post.savePost(postInfo, function (err, doc) {
                    if (err) {
                        console.error('Error', err);
                        var error = new Error('포스팅 실패');
                        error.code = 400;
                        next(error);
                    } else {
                        console.log('Done', doc);
                        callback();
                    }
                });//Post.savePost
            }
        ],
        function (err) {
            if (err) {
                res.sendStatus(500);
            }
            else {
                var msg = {
                    code: 200,
                    msg: 'Success'
                };
                res.status(msg.code).json(msg);
                //res.redirect('/');
            }
        });
};


//webTest용
module.exports.getWebShowList = function (req, res, next) {
    var showPageSession = null;
    var isStart = req.query.isStart;
    var region = req.query.region;
    var field = req.query.field;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;

    var lastSeen = null;

    //isStart가 null
    if (!isStart) {
        lastSeen = req.session[showPageSession];
    }

    var showList = [];

    Post.hell(region, startDate, endDate, field, lastSeen, function (err, shows) {
        if (err) {
            console.error(err);
            var error = new Error('Show List 를 가져올 수 없다');
            error.code = 400;
            return next(error);
        }//if-err
        var order = 0;

        async.each(shows, function (showModel, callback) {
            var result = {
                seq: (order++),
                postInfo: showModel
            };

            //resource 한개만 가져오기
            result.postInfo['resources'] = result.postInfo.resources[0];

            Comment.countCommentsOfPost(showModel._id, function (err, count) {
                if (err) {
                    console.error('CANT COUNT DATGUL', err);
                    var error = new Error('countComment Error');
                    error.code = 400;
                    return next(error);
                }
                result['commentCnt'] = count;
                //console.log('result, :', result);
                showList.push(result);
                callback();
            });//countCommentsOfPost

        }, function (err) {
            if (err) {
                var error = new Error('글이 없습니다.');
                error.code = 404;
                return next(error);
            }
            showList.sort(function (a, b) {
                return a.seq - b.seq;
            });
            //마지막 게시물의 id값
            //console.log(showList.slice(-1)[0].postInfo._id);
            //console.log(showList.length);
            if (showList.length != 0) {
                req.session[showPageSession] = showList.slice(-1)[0].postInfo._id;
                res.render('shows', {shows: showList});
            } else {
                var error = new Error('게시물이 더 이상 없어요!');
                error.code = 404;
                return next(error);
            }
        });//async.each

    });//findPostType
//post결과와 comment수 결과를 담을 객체 생성
};//getShowList

