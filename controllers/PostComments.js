/**
 * Created by Moon Jung Hyun on 2015-11-07.
 */

var Comment = require('./../models/Comments');

/**
 * 해당 Comment 삭제하기
 * @param req
 * @param res
 * @param next
 */
module.exports.deleteComment = function(req, res, next){
    var commentId = req.params.commentId;
    if(!commentId){
        var error = new Error('URL 에 commentId 부탁해요.');
        error.code = 400;
        return next(error);
    }
    Comment.removeComment(commentId, function(err, doc){
        if(err){
            console.error('ERROR REMOVING COMMENT ', err);
            var error = new Error('댓글을 삭제할 수 없습니다.');
            error.code =400;
            return next(error);
        }
        var msg = {
            code : 200,
            msg : 'Success'
        };
        res.status(msg.code).json(msg);
    });
};
