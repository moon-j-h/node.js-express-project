/**
 * Created by Moon Jung Hyun on 2015-11-06.
 */
var userKey = '564a926a29c7cf6416be1117'; // session에 있을 정보
var blogKey = '564a926b29c7cf6416be1118'; // session에 있을 정보

var async = require('async');

var Blog = require('./../models/Blogs');  // web 에서 정보 입력시 편하게 하게 하려고 추가 나중에 지움요.

var Comment = require('./../models/Comments');
var Post = require('./../models/Posts');
var Report = require('./../models/Reports');
var User = require('./../models/Users');


/**
 * 모든 type의 Post 가져오기
 * 회원이 등록한 workPost
 * 회원의 artist가 등록한 workPost, showPost
 * @param req
 * @param res
 * @param next
 */
module.exports.getPosts = function(req, res, next){
    var isStart = req.query.isStart;
    var emotion = req.query.emotion;
    var field = req.query.field;
    //1. 회원의 myArtists를 가져온다.
    User.findMyArtistIds(req.user.userKey, function(err, myArtists){
        if(err){
            console.error('ERROR GETTING MY ARTISTS ', err);
            var error = new Error('myArtists 가져오기 실패');
            error.code = 400;
            return next(error);
        }
        console.log('myArtist ', myArtists.myArtists);
        var lastSeen = null;
        if(!isStart){
            lastSeen = req.session['fanPage'];
        }
        // 2. 회원이 등록한 work post와 회원의 artist가 등록한 work/show post를 가져온다.
        Post.findPostsAtFanPage(req.user.activityBlogKey, myArtists.myArtists, emotion, field, lastSeen, function(err, docs){
            if(err){
                console.error('ERROR GETTING FAN PAGE ', err);
                var error = new Error('posts 를 가져올 수 없음.');
                error.code = 400;
                return next(error);
            }
            if(docs.length == 0){
                var error = new Error('더 이상 없음');
                error.code = 404;
                return next(error);
            }else{
                // 3. work post 일 경우에는 comment cnt 와 commnet 2개를
                // show post 일 경우에는 comment cnt만 가져온다.
                var order = 0;
                var posts = [];
                async.each(docs, function(doc, callback){
                    var tmp ={
                        seq : (order++),
                        postInfo : doc
                    };
                    if(doc.postType == 0){
                        // workPost
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
                    }else{
                        // showPost
                        Comment.countCommentsOfPost(doc._id, function (err, count) {
                            if (err) {
                                console.error('CANT COUNT DATGUL', err);
                                var error = new Error('countComment Error');
                                error.code = 400;
                                return next(error);
                            }
                            tmp['commentCnt'] = count;
                            //console.log('result, :', result);
                            posts.push(tmp);
                            callback();
                        })
                    }
                }, function(err){
                    if(err){
                        var error = new Error('error at async each');
                        error.code = 400;
                        return next(error);
                    }
                    req.session['fanPage'] = docs.splice(-1)[0]._id;
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
            }
        });
    });
};

/**
 * Post 삭제하기
 * @param req
 * @param res
 * @param next
 */
module.exports.deletePost = function (req, res, next) {
    var postId = req.params.postId;
    if (!postId) {
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(error);
    }
    Post.removePost(postId, function (err, doc) {
        if (err) {
            console.error('ERROR REMOVE POST ', err);
            var error = new Error('Post를 삭제할 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        //console.log(doc);
        Comment.removeComments(doc._id, function (err, docs) {
            if (err) {
                console.error('ERROR REMOVE COMMENTS ', err);
                var error = new Error('Comments를 삭제할 수 없습니다. ');
                error.code = 400;
                return next(error);
            }
            //console.log(docs);
            var msg = {
                code: 200,
                msg: 'Success'
            };
            res.status(msg.code).json(msg);
        });
    });
};

/**
 * 해당 Post에 대한 User(Blog)의 좋아요 추가/취소하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.changeLike = function (req, res, next) {
    var id = req.params.postId;
    var status = req.params.likeStatus;
    console.log('postId', id);
    console.log('likeStatus', status);
    var blogKey = req.user.artistBlogKey;
    if (status == 'like') { // 좋아요
        Post.pushLike(id, blogKey, function (err, doc) {
            if (err) {
                console.error('ERROR PUSH LIKE', err);
                var error = new Error('좋아요에 실패했습니다.');
                error.code = 400;
                return next(error);
            }
            console.log('push like ', doc);
            var msg = {
                code: 200,
                msg: 'Success'
            };
            res.status(msg.code).json(msg);
        });
    } else if (status == 'unlike') { // 좋아요 취소
        Post.pullLike(id, blogKey, function (err, doc) {
            if (err) {
                console.error('ERROR PULL LIKE ', err);
                var error = new Error('좋아요를 취소할 수가 없습니다.');
                error.code = 400;
                return next(error);
            }
            console.log('pull like ', doc);
            var msg = {
                code: 200,
                msg: 'Success'
            };
            res.status(msg.code).json(msg);
        });
    } else {
        var error = new Error('Only like Or unlike');
        error.code = 400;
        return next(error);
    }

};

/**
 * 해당 Post에 대해 한 User(Blog)가 신고하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.reportPost = function (req, res, next) {
    var postId = req.params.postId;
    if (!postId) {
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(error);
    }
    var blogKey = req.user.artistBlogKey;
    console.log('req.user.artistBlogKey ', blogKey);
    Report.isReported(postId, blogKey, function (err, isReported) {
        if (err) {
            console.error('ERROR CHECK REPORTER ', err);
            var error = new Error('신고 여부를 확인할 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        if (!isReported) {
            Report.saveReport(postId, blogKey, function (err, doc) {
                if (err) {
                    console.error('ERROR SAVE REPORT ', err);
                    var error = new Error('신고 실패했습니다.');
                    error.code = 400;
                    return next(error);
                }
                var msg = {
                    code: 200,
                    msg: 'Success'
                };
                res.status(msg.code).json(msg);
            });
        } else {
            console.log('이미 신고함...');
            var error = new Error('이미 신고한 Post입니다.');
            error.code = 400;
            return next(error);
        }
    });
};


////////////////////////////////////////////////////////////////////////////////
/**
 * 댓글 저장하기
 * @param req
 * @param res
 * @param next
 */
module.exports.addComment = function (req, res, next) {
    console.log('addComment');
    var postId = req.params.postId;
    Comment.saveComment(postId, req.user.activityBlogKey, req.body.content, function (err, doc) {
        if (err) {
            console.error('ERROR AT ADD REPLY - ', err);
            var error = new Error('댓글을 입력할 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        // app ...
         var msg = {
         code : 200,
         msg : 'Success'
         };
         res.status(msg.code).json(msg);
    });
};
/**
 * 댓글 리스트 가져오기
 * @param req
 * @param res
 * @param next
 */
module.exports.getComments = function (req, res, next) {
    var id = req.params.postId;
    var isStart = req.query.isStart;
    if (!id) {
        var error = new Error('URL 확인 부탁해요.');
        error.code = 400;
        return next(error);
    }
    var lastSeenOfComments = null;
    if (!isStart) {
        lastSeenOfComments = req.session[id];
    }

    Comment.findCommentsOfPost(id, lastSeenOfComments, function (err, docs) {
        if (err) {
            var error = new Error('댓글을 불러올 수 없습니다.');
            error.code = 400;
            return next(error);
        }
        if(docs.length != 0){
            req.session[id] = docs.slice(-1)[0]._id;

            var msg = {
                code: 200,
                msg: 'Success',
                result: docs.reverse()
            };
            res.status(msg.code).json(msg);
        } else {
            var error = new Error('댓글이 없습니다.');
            error.code = 404;
            return next(error);
        }
    });
};
