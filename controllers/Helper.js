/**
 * Created by Moon Jung Hyun on 2015-11-22.
 */

var async = require('async');
var Comment = require('./../models/Comments');

/**
 *
 * @param req
 * @param res
 * @param type
 * @param sessionId
 * @param docs
 */
module.exports.findPostsVerPostList = function(req,res, type, sessionId, docs){
    console.log('seesionId ', sessionId);
    var order = 0;
    var posts = [];
    async.each(docs, function(doc, callback){
        var tmp ={
            seq : (order++),
            postInfo : doc
        };
        Comment.countCommentsOfPost(doc._id, function(err, count){
            if(err){
                console.error('ERROR COUNT COMMENTS ', err);
                var error = new Error('댓글 개수를 셀 수 없습니다.');
                error.code = 400;
                return next(error);
            }
            tmp['commentCnt'] = count;
            Comment.findLast2Comments(doc._id, function(err, docs){
                if(err){
                    console.error('ERROR FIND LAST 2 COMMENTS ', err);
                    var error = new Error('최신 댓글 2개를 가져오는데 실패했습니다.');
                    error.code = 400;
                    return next(error);
                }
                tmp['comments'] = docs.reverse();
                //console.log('final workPost ', tmp);
                posts.push(tmp);
                callback();
            });
        });
    }, function(err){
        if(err){
            var error = new Error('error at async each');
            error.code = 400;
            return next(error);
        }
        if(type == 2)
            req.session[sessionId] = docs.splice(-1)[0]._id;
        posts.sort(function(a, b){
            return a.seq - b.seq;
        });
        var msg = {
            code : 200,
            msg : 'Success',
            result : posts
        };
        res.status(msg.code).json(msg);
    });
};
/**
 * 사진 한개 리스트로 응답하기
 * @param req
 * @param res
 * @param sessionId
 * @param docs
 */
module.exports.findWorkPostsVerOnePictureList = function(req, res, sessionId, docs){
    console.log('seesionId ', sessionId);
    async.each(docs, function(doc, callback){
        doc.resources = doc.resources[0];
        callback();
    }, function(err){
        if(err){
            console.error('ERROR AFTER GETTING POSTS BY HASH TAG', err);
            var error = new Error('post by hash tag each 하는데 실패...');
            error.code = 400;
            return next(error);
        }
        req.session[sessionId] = docs.slice(-1)[0]._id;
        var msg = {
            code : 200,
            msg : 'Success',
            result : docs
        };
        res.status(msg.code).json(msg);
    });
};


var async = require('async');
var AWS = require('aws-sdk');

var awsS3 = require('./../config/s3');
AWS.config.region = awsS3.region;
AWS.config.accessKeyId = awsS3.accessKeyId;
AWS.config.secretAccessKey = awsS3.secretAccessKey;

var fs = require('fs');
var S3 = new AWS.S3();
var bucketName = awsS3.bucketName;
var uploadUrl = __dirname + '/../upload';
var easyimage = require('easyimage');

/**
 * 원본 파일과 썸네일 파일 업로드 하기
 * @param file
 * @param newFileName
 * @param ext
 * @param dir
 * @param callback
 */
module.exports.uploadImageAndThumbnail = function(file, newFileName, ext, dir, callback) {

    var fileUrl = {};
    var contentType = file.type;
    var filePath = file.path;
    console.log('filePath',filePath);
    console.log('contentType',contentType);
    var readStream = fs.createReadStream(file.path);
    var itemKey = dir + newFileName+ext;
    async.waterfall([
        // step1. 원본이미지 올리기, 이미지 경로 call보내기
        function(callback){
            var params = {
                Bucket: bucketName,
                Key: itemKey,
                ACL: 'public-read',
                Body: readStream,
                ContentType: contentType
            };

            S3.putObject(params, function (err, data) {
                if (err) {
                    console.error('S3 Putobject Error', err);
                    callback(err);
                } else {
                    //var imageUrl = S3.endpoint.href + bucketName + '/' + itemKey;
                    var imageUrl = 'http://'+S3.endpoint.hostname+ '/'+ bucketName + '/' + itemKey;
                    console.log('imageUrl ', imageUrl);
                    console.log('filePath',file.path);
                    fileUrl['type'] = contentType;
                    fileUrl['originalPath'] = imageUrl;
                    callback(null, fileUrl);
                }
            });
        },
        // step2. 썸네일 만들기, 올리기/ 경로
        function(fileUrl, callback){
            var th_fileName = 'th_' + newFileName+ext; // 썸네일 파일명
            var th_filePath = uploadUrl + '/' + th_fileName;
            console.log('filePath',filePath);
            console.log('th_filePath',th_filePath);

            easyimage.resize({
                src: filePath,
                dst: th_filePath,
                width : 500,
                height : 500
            }).then(function(image){
                console.log('thumbnail result image ', image);
                var th_itemKey = dir+'Thumbnails/'+ th_fileName;
                var th_readStream = fs.createReadStream(th_filePath);

                var params = {
                    Bucket: bucketName,
                    Key: th_itemKey,
                    ACL: 'public-read',
                    Body: th_readStream,
                    ContentType: contentType
                };

                S3.putObject(params, function (err, data) {
                    if (err) {
                        console.error('S3 Putobject Error', err);
                        callback(err);
                    } else {
                        var thImageUrl = 'http://'+S3.endpoint.hostname+ '/'+ bucketName + '/' + th_itemKey;
                        console.log('thImageUrl ', thImageUrl);
                        fs.unlink(filePath, function(err){
                            if(err){
                                var error = new Error('파일 삭제 실패');
                                error.code = 400;
                                return next(error);
                            } else{
                                fs.unlink(th_filePath, function(err){
                                    if(err){
                                        var error = new Error('썸네일 파일 삭제 실패');
                                        error.code = 400;
                                        return next(error);
                                    } else{
                                        fileUrl['thumbnailPath'] = thImageUrl;
                                        callback(null);
                                    }
                                });
                            }
                        });
                    }
                });
            },function(err){   // 썸네일 쪽 에러인듯???
               if(err){
                   console.log('err',err);
                   callback(err);
               }else{
                   callback(null);
               }
            });
        }
    ], function(err){
        if(err){
            console.error('uploadImageAndThumbnail err',err);
            callback(err, null);
        }else{
            console.log('uploadImageAndThumbnail success?');
            callback(null, fileUrl);
        }

    });
};

/**
 * 원본 파일만 업로드 하기
 * @param file
 * @param newFileName
 * @param ext
 * @param dir
 * @param callback
 */
module.exports.uploadFile = function(file, newFileName, ext, dir, callback) {
    var fileUrl = {};
    var contentType = file.type;
    var readStream = fs.createReadStream(file.path);

    var itemKey = dir+ newFileName+ext;
    console.log('File item Key ', itemKey);

    var params = {
        Bucket: bucketName,
        Key: itemKey,
        ACL: 'public-read',
        Body: readStream,
        ContentType: contentType
    };

    S3.putObject(params, function (err, data) {
        if (err) {
            console.error('S3 Putobject Error', err);
            callback(err, null);
        } else {
            //var uploadedUrl = S3.endpoint.href + bucketName + '/' + itemKey;
            var uploadedUrl = 'http://'+S3.endpoint.hostname+ '/'+ bucketName + '/' + itemKey;
            console.log('uploadedUrl ', uploadedUrl);
            fs.unlink(file.path, function(err){
                if(err)
                    callback(err, null);
                else{
                    fileUrl['type'] = contentType;
                    fileUrl['originalPath'] = uploadedUrl;
                    fileUrl['thumbnailPath'] = uploadedUrl;
                    console.log('fileUrl @ only file upload',fileUrl);
                    callback(null, fileUrl);
                }
            });
        }
    });
};
