/**
 * Created by skplanet on 2015-11-16.
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
var uploadUrl = __dirname + '/../upload';
var defaultArtistProfileUrl = 'https://s3-ap-northeast-1.amazonaws.com/in-deepen/images/profile/icon-person.jpg';

var Blog = require('./../models/Blogs');
var User = require('./../models/Users');

var userKey = '563ef1ca401ae00c19a15828'; // session에 있을 정보
var blogKey = '563ef1cb401ae00c19a15838'; // session에 있을 정보

/**
 * 공간 Blog 등록
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.addSpaceBlog = function (req, res, next) {
    //임시 로그인

    //var userKey = req.session['userKey']
    var spaceInfo = {
        //_user : req.body.userId,
        _user : req.user.userKey,
        type: 1,
        nick: req.body.nick,
        location: {
            address: req.body.address,
            point: {
                coordinates: [req.body.latitude, req.body.longitude]
            }
        },
        phone: req.body.phone,
        email: req.body.email,
        intro: req.body.intro,
        isActivated : fasle
    };
    //res.json(spaceInfo);
    Blog.saveBlog(spaceInfo, function (err, docs) {
        if (err) {
            console.error('err ', err);
            var err = new Error('공간 블로그 등록실패');
            err.code = 400;
            return next(err);
        }
        var msg = {
            code: 200,
            msg: '공간블로그 등록 성공적'
        };
        console.log(docs);
        res.status(msg.code).json(msg);
    });
};

/**
 * 공간 Blog 프로필 사진 정보 가져오기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.getProfilePhoto = function (req, res, next) {
    var blogId = req.params.blogId;
    if (!blogId) {
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(error);
    }
    Blog.findProfilePhotoOfBlog(blogId, function (err, doc) {
        if (err) {
            var error = new Error('프로필 사진을 가져올 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        var msg = {
            code: 200,
            msg: 'Success',
            result: doc
        };
        res.status(msg.code).json(msg);
    });
}

/**
 * 공간 Blog 프로필 사진 정보 수정하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
//기본 사진
exports.modifyProfilePhoto = function (req, res, next) {
    var blogId = req.params.blogId;
    if (!blogId) {
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(errpr);
    }
    async.waterfall(
        [
            function (callback) {
                var form = new formidable.IncomingForm();
                form.encoding = 'utf-8';
                form.uploadDir = uploadUrl;
                form.keepExtensions = true;
                form.parse(req, function (err, fields, files) {
                    if (err) {
                        return callback(err, null);
                    }
                    var file = files.file;
                    callback(null, file);
                });
            },
            function (file, callback) {
                if (file == null) {
                    console.log('not file');
                    callback(null, defaultArtistProfileUrl);
                } else {
                    var randomStr = randomstring.generate(10);
                    var newFileName = 'profile_' + randomStr;
                    var extname = pathUtil.extname(file.name);
                    var contentType = file.type;
                    var fileStream = fs.createReadStream(file.path);
                    var itemKey = 'images/profile/' + newFileName + extname;
                    var params = {
                        Bucket: bucketName,
                        Key: itemKey,
                        ACL: 'public-read',
                        Body: fileStream,
                        ContentType: contentType
                    };
                    s3.putObject(params, function (err, data) {
                        if (err) {
                            console.error('S3 PutObject Error', err);
                            callback(err);
                        }
                        else {
                            var imageUrl = s3.endpoint.href + bucketName + '/' + itemKey;
                            fs.unlink(file.path, function (err) {
                                if (err) {
                                    var error = new Error('파일 삭제를 실패했습니다.');
                                    error.code = 500;
                                    return next(error);
                                } else {
                                    callback(null, imageUrl);
                                }
                            });
                        }
                    });
                }
            },
            function (url, callback) {
                Blog.updateProfilePhotoOfBlog(blogId, url, function (err, doc) {
                    if (err) {
                        console.error('ERROR WHILE UPDATING PROFILE PHOTO AT THE SPACE BLOG ', err);
                        var error = new Error('Blog Profile 사진을 변경하는데 실패했습니다.');
                        error.code = 500;
                        return next(error);
                    }
                    console.log('doc ', doc);
                    User.updateProfilePhoto(doc._user, url, function (err, doc) {
                        if (err) {
                            console.error('ERROR UPDATING PROFILE PHOTO OF USER ', err);
                            var error = new Error('User Profile 사진을 변경하는데 실패했습니다.');
                            error.code = 500;
                            return next(error);
                        }
                        callback();
                    });
                });
            }
        ],
        function (err) {
            if (err) {
                res.sendStatus(500);
            } else {
                var msg = {
                    code: 200,
                    msg: 'Success'
                };
                res.status(msg.code).json(msg);
            }
        }
    )
};

/**
 * 공간 Blog 위치 정보 가져오기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.getLocation = function (req, res, next) {
    var blogId = req.params.blogId;
    if (!blogId) {
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(errpr);
    }
    Blog.findLocation(blogId, function (err, doc) {
        if (err) {
            var error = new Error('위치를 가져오다가 실패했어요!');
            error.code = 400;
            return next(err);
        }
        var msg = {
            code: 200,
            msg: '위치를 가져왔습니다',
            result: doc
        };
        res.status(msg.code).json(msg);
    });
};

/**
 * 공간 Blog 기본 정보 가져오기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.getProfile = function (req, res, next) {
    var blogId = req.params.blogId;
    if (!blogId) {
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(error);
    }
    Blog.findProfileOfSpaceBlog(blogId, function (err, doc) {
        if (err) {
            console.error('ERROR GETTING PROFILE OF THE SPACE BLOG ', err);
            var error = new Error('profile 을 가져올 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        console.log('profile ', doc);
        var msg = {
            code: 200,
            msg: 'Success',
            result: doc
        };
        res.status(msg.code).json(msg);
    });
};

/**
 * 공간 Blog 기본 정보 수정하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.modifyProfile = function (req, res, next) {
    var blogId = req.params.blogId;
    if (!blogId) {
        var error = new Error('URL 확인 부탁합니다.');
        error.code = 400;
        return next(error);
    }
    var newInfo = {
        nick: req.body.nick,
        intro: req.body.intro,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address
    };
    console.log('newInfo', newInfo);

    Blog.updateProfileOfBlog(blogId, newInfo, function (err, doc) {
        if (err) {
            console.error('ERROR UPDATING PROFILE AT THE SPACEBLOG ', err);
            var error = new Error('Blogs 쪽 update 실패 ㅠㅜ');
            error.code = 400;
            return next(error);
        }
        var msg = {
            code: 200,
            msg: 'Success'
        };
        res.status(msg.code).json(msg);
    });
};

/**
 * 공간 블로그 삭제
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.deleteSpaceBlog = function (req, res, next) {
    var blogId = req.params.blogId;
    if (!blogId) {
        var error = new Error('URL 확인 부탁합니다.');
        error.code = 400;
        return next(error);
    }
    Blog.removeBlog(blogId, function(err,doc){
        if (err) {
            console.error('ERROR DELETING THE BLOG', err);
            var error = new Error('지우기 실패했어요!');
            error.code = 400;
            return next(error);
        }
        var msg = {
            code: 200,
            msg: '제거 완료'
        };
        res.status(msg.code).json(msg);
    });
};