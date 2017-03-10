/**
 * Created by Moon Jung Hyun on 2015-11-16.
 */

module.exports.requiresLogin = function (req, res, next) {
    if (req.isAuthenticated()) return next();
    var error = new Error('로그인 필요...');
    error.code = 401; // Unauthorized
    return next(error);
};
var Post = require('./../../models/Posts');
module.exports.post = {
    hasAuthorization: function (req, res, next) {
        var postId = req.params.postId;
        console.log('post authorization postId ', postId);
        Post.findOne({_id: postId}).
            select('_writer').
            populate('_writer', '_user').
            exec(function (err, doc) {
                if (err) {
                    console.error('ERROR @ POST AUTH ', err);
                    var error = new Error('writer 정보 가져오기 실패');
                    error.code = 400;
                    return next(error);
                }
                if (!doc) {
                    var error = new Error('post id 다시 확인하셈요');
                    error.code = 404;
                    return next(error);
                }
                console.log('doc ', doc);
                if (doc._writer._user == req.user.userKey) {
                    console.log('ok');
                    next();
                } else {
                    var error = new Error('권한 없음요.');
                    error.code = 401;
                    return next(error);
                }
            });
    },
    hasAlreadyLiked: function (req, res, next) {
        var url = req.url.split('/')[2];
        console.log('post auth hasAlreadyLiked ', url);
        var postId = req.params.postId;
        Post.isLiked(postId, req.user.artistBlogKey, function(err, count){
            if(err){
                console.error('ERROR @ POST AUTHORIZATION ', err);
                var error = new Error('@ Like Count');
                error.code = 400;
                return next(error);
            }else{
                console.log('like count', count);
                if(url == 'like'){
                    if(count == 0){
                        next();
                    }else{
                        var error = new Error('이미 함');
                        error.code = 400;
                        return next(error);
                    }
                }else if(url == 'unlike') {
                    if (count != 0) {
                        next();
                    } else {
                        var error = new Error('한적 없음');
                        error.code = 400;
                        return next(error);
                    }
                }else{
                    var error = new Error('url 확인하셈요.');
                    error.code = 400;
                    return next(error);
                }
            }
        });
    },
    whoIsWriter : function(req, res, next){
        var postId = req.params.postId;
        Post.findOne({_id : postId}).
            select('-postType -createAt -updateAt -content -hashTags -likes -work -show -resources -youTube').
            populate('_writer', '_user').
            exec(function(err, doc){
                if(err){
                    console.error('ERROR @ POST AUTHORIZATION ', err);
                    var error = new Error('@ who is Writer ?');
                    error.code = 400;
                    return next(error);
                }else{
                    console.log('doc', doc);
                    if(doc._writer._user != req.user.userKey) {
                        next();
                    }else{
                        var error = new Error('본인 개시글에는 할 수 없음');
                        error.code = 400;
                        return next(error);
                    }
                }
            });
    }
};
var Blog = require('./../../models/Blogs');
module.exports.blog = {
    /**
     * 블로그 주인 체크. 주인만 가능하게 함 (수정, 삭제)
     * @param req
     * @param res
     * @param next
     */
    hasAuthorization: function (req, res, next) {
        var blogId = req.params.blogId;
        Blog.findOne({_id: blogId}).
            select('_user').
            exec(function (err, doc) {
                if (err) {
                    console.error('ERROR @ BLOG AUTH ', err);
                    var error = new Error('blog user 정보 가져오기 실패');
                    error.code = 400;
                    return next(error);
                }
                if (!doc) {
                    var error = new Error('blog id 다시 확인하셈요');
                    error.code = 404;
                    return next(error);
                }
                if (doc._user == req.user.userKey) {
                    console.log('ok');
                    next();
                } else {
                    var error = new Error('권한 없음요.');
                    error.code = 401;
                    return next(error);
                }
            });
    },
    /**
     * 기존에 했을 경우 불허
     * @param req
     * @param res
     * @param next
     */
    hasAlreadyDone: function (req, res, next) {
        var url = req.url.split('/');
        var at = url[2];
        console.log('3 ', at);
        if (at != 'fan' && at != 'iMissYous') {
            // 권한 체크 필요 없음
            next();
        } else {
            Blog.isAlreadyDone(req.params.blogId, req.user.artistBlogKey, at, function (err, count) {
                if (err) {
                    console.error('ERROR @ BLOG AUTHORIZATION ', err);
                    var error = new Error('@ fan & iMissYou');
                    error.code = 400;
                    return next(error);
                }
                console.log('count ', count);
                if(count == 0) next();
                else{
                    var error = new Error('이미 함');
                    error.code = 400;
                    return next(error);
                }
            });
        }
    },
    /**
     * 블로그 주인 체크. 주인일 경우 불허 (fan, iMissYou)
     * @param req
     * @param res
     * @param next
     */
    whoIsOwner : function(req, res, next){
        var blogId = req.params.blogId;
        Blog.findOne({_id: blogId}).
            select('_user').
            exec(function (err, doc) {
                if (err) {
                    console.error('ERROR @ BLOG AUTH ', err);
                    var error = new Error('blog user 정보 가져오기 실패');
                    error.code = 400;
                    return next(error);
                }
                if (!doc) {
                    var error = new Error('blog id 다시 확인하셈요');
                    error.code = 404;
                    return next(error);
                }
                if (doc._user == req.user.userKey) {
                    var error = new Error('권한 없음요.');
                    error.code = 401;
                    return next(error);
                } else {
                    next();
                }
            });
    }
};

var User = require('./../../models/Users');
module.exports.user = {
    hasAuthorization: function (req, res, next) {
        var options = {
            criteria : {_id : req.user.userKey},
            select : '-email -name -provider -authToken -facebook -intro -phone -myArtists -createAt -updateAt -isPublic'
        };
        User.findUser(options, function(err, doc){
            if(err){
                console.error('ERROR @ USER AUTH ', err);
                var error = new Error('user 정보 가져오기 실패');
                error.code = 400;
                return next(error);
            }
            if(!doc) {
                var error = new Error('불허');
                error.code = 400;
                return next(error);
            }
            if(!doc.authenticate(req.body.password)){
                var error = new Error('불허');
                error.code = 400;
                return next(error);
            }
            next();
        });
    }
};

var Comment = require('./../../models/Comments');
module.exports.comment = {
    hasAuthorization : function(req, res, next){
        var commentId = req.params.commentId;
        Comment.findCommentWriter(commentId, function(err, doc){
            if(err){
                console.error('ERROR @ COMMENT AUTH ', err);
                var error = new Error('comment 정보 가져오기 실패');
                error.code = 400;
                return next(error);
            }
            if(!doc){
                var error = new Error('comment 정보 가져오기 실패');
                error.code = 400;
                return next(error);
            }
            if(doc._writer._user == req.user.userKey){
                console.log('ok');
                next();
            }else{
                var error = new Error('권한 없음');
                error.code = 401;
                return next(error);
            }
        });
    }
};



