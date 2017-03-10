/**
 * Created by Moon Jung Hyun on 2015-11-19.
 */

var Post = require('./../models/Posts');
var Blog = require('./../models/Blogs');
var HashTag = require('./../models/HashTags');
var async = require('async');

/**
 * 해시태그, 예술가, 공간 검색하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.searchAtAll = function(req, res, next){
    var key = req.query.key;
    console.log('key ', key);
    if(!key){
        var error = new Error('key 주세요..');
        error.code = 400;
        return next(error);
    }
    async.waterfall(
        [
            function(callback){
                // hash tag 검색
                HashTag.findHashTags(key, function(err, docs){
                    if(err){
                        callback(err);
                    }else{
                        callback(null, docs);
                    }
                });
            },
            function(hashTags, callback){
                Blog.findBlogIds(key, 0, function(err, docs){
                    if(err){
                        callback(err);
                    }else{
                        callback(null, hashTags, docs);
                    }
                })
            },
            function(hashTags, artists, callback){
                Blog.findBlogIds(key, 1, function(err, docs){
                    if(err){
                        callback(err);
                    }else{
                        callback(null, hashTags, artists, docs);
                    }
                })
            },
            function(hashTags, artists, spaces, callback){
                if(hashTags.length==0 && artists.length==0 &&spaces.length==0){
                    var error = new Error('없음');
                    error.code = 404;
                    return next(error);
                }else{
                    var msg = {
                        code : 200,
                        msg : 'Success',
                        result :{
                            hashTags : hashTags,
                            artists : artists,
                            spaces : spaces
                        }
                    };
                    res.status(msg.code).json(msg);
                }
                callback();
            }
        ],
        function(err){
            if(err){
                console.error('ERROR ', err);
                res.status(500);
            }
        }
    )
};

/**
 * 해시태그로 겁색하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.searchAtHashTag = function(req, res, next){
    var key = req.query.key;
    console.log('key ', key);
    if(!key){
        var error = new Error('key 주세요..');
        error.code = 400;
        return next(error);
    }
    HashTag.findHashTags(key, function(err, docs){
        if(err){
            console.error('ERROR FIND HASH TAGS ', err);
            var error = new Error('해시태그를 찾는 중에 error');
            error.code = 400;
            return next(error);
        }
        console.log('docs ', docs);
        if(docs.length != 0){
            var msg = {
                code : 200,
                msg : 'Success',
                hashTags : docs
            };
            res.status(msg.code).json(msg);
        }else{
            var error = new Error('없음');
            error.code = 404;
            return next(error);
        }
    });
};

/**
 * 아티스트 검색하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.searchAtArtist = function(req, res, next){
    var key = req.query.key;
    console.log('key ', key);
    if(!key){
        var error = new Error('key 주세요..');
        error.code = 400;
        return next(error);
    }
    Blog.findBlogIds(key, 0,function(err, docs){
        if(err){
            console.error('ERROR FIND ARTISTS SEARCH ', err);
            var error = new Error('Artists 를 찾을 수 없음');
            error.code = 400;
            return next(error);
        }
        console.log('docs ', docs);
        if(docs.length != 0){
            var msg = {
                code : 200,
                msg : 'Success',
                artists : docs
            };
            res.status(msg.code).json(msg);
        }else{
            var error = new Error('없음');
            error.code = 404;
            return next(error);
        }
    });
};

/**
 * 공간 검색하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.searchAtSpace = function(req, res, next){
    var key = req.query.key;
    console.log('key ', key);
    if(!key){
        var error = new Error('key 주세요..');
        error.code = 400;
        return next(error);
    }
    Blog.findBlogIds(key, 1,function(err, docs){
        if(err){
            console.error('ERROR FIND SPACE SEARCH ', err);
            var error = new Error('space 를 찾을 수 없음');
            error.code = 400;
            return next(error);
        }
        console.log('docs ', docs);
        if(docs.length != 0){
            var msg = {
                code : 200,
                msg : 'Success',
                spaces : docs
            };
            res.status(msg.code).json(msg);
        }else{
            var error = new Error('없음');
            error.code = 404;
            return next(error);
        }
    });
};