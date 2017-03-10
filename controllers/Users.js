/**
 * Created by Moon Jung Hyun on 2015-11-14.
 */

var User = require('./../models/Users');
var Blog = require('./../models/Blogs');

module.exports.join = function(req, res, next){
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;
    var nick = req.body.nick;
    if(!email || !password || !name || !nick){
        console.log('body가 부족해...');
        var error = new Error('데이터가 부족합니다.');
        error.code = 400;
        return next(error);
    }
    var userInfo = {
        email: email,
        password: password,
        name: name,
        nick: nick
    };
    User.saveUser(userInfo, function(err, doc){
        if(err){
            console.error('ERROR SAVING USER INFO ', err);
            var error = new Error('회원 등록 실패.');
            error.code = 400;
            return next(error);
        }
        console.log('user join doc ', doc);
        var blogInfo = {
            _user : doc._id,
            nick : doc.nick,
            profilePhoto : doc.profilePhoto
        };
        Blog.saveBlog(blogInfo, function(err, doc){
            if(err){
                console.error('Save Blog Error in User post event ', err);
                var error = new Error('artistBlog 생성 실패');
                error.code= 400;
                return next(error);
            }
            console.log('artistBlog ', doc);
            var msg = {
                code : 200,
                msg : 'Success'
            };
            res.status(msg.code).json(msg);
        });
    });
};

/**
 * email 중복 체크하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.checkEmail = function(req, res, next){
    var email = req.body.email;
    if(!email){
        var error = new Error('Email 보내주세요.');
        error.code = 400;
        return next(error);
    }
    User.isExistEmail(email, function(err, doc){
        if(err){
            console.error('ERROR CHECK EMAIL ', err);
            var error = new Error('이메일 중복 체크 오류..');
            error.code = 400;
            return next(error);
        }
        if(!doc){
             var msg = {
                 code : 200,
                 msg : 'ok'
             };
            res.status(msg.code).json(msg);
        }else{
            var error = new Error('이미 사용중인 이메일입니다.');
            error.code = 400;
            return next(error);
        }
    });
};

/**
 * 비밀번호 변경하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.changePw = function(req, res, next){
    var newPw = req.body.newPw;
    if(!newPw){
        var error = new Error('데이터 확인 요망.');
        error.code = 400;
        return next(error);
    }
    var pw = {
        newPw : newPw
    };
    console.log('pw ', pw);
    User.updatePassword(req.user.userKey, pw, function(err, doc){
        if(err){
            console.error('ERROR UPDATE PASSWORD ', err);
            var error = new Error('비밀번호 변경 실패');
            error.code = 400;
            return next(error);
        }
        console.log('doc ', doc);
        if(doc){
            var msg = {
                code : 200,
                msg : 'Success'
            };
            res.status(msg.code).json(msg);
        }else{
           var error = new Error('비밀번호 변경실패');
            error.code = 400;
            return next(error);
        }
    });
};

/**
 * 로그인 회원 (_id, 닉네임, 프로필사진) 가져오기(전 /menu)
 * @param req
 * @param res
 * @param next
 */
module.exports.getUserInfo = function(req, res, next){
    Blog.findBlogsOfUser(req.user.userKey, function(err, docs){
        if(err){
            var error = new Error('블로그 정보들을 가져오는데 실패함요');
            error.code = 400;
            return next(error);
        }
        var msg = {
            code : 200,
            msg : 'Success',
            result : docs
        };
        res.status(msg.code).json(msg);
    });
};

/**
 * 회원 활동모드 변경하기
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports.changeActivityMode = function(req, res, next){
    var blogId = req.body.blogId;
    if(!blogId){
        var error = new Error('blogId를 주세요....');
        error.code = 400;
        return next(error);
    }
    Blog.updateIsActivated(req.user.userKey, blogId, function(err, doc){
        if(err){
            var error = new Error('update 중 error...');
            error.code = 400;
            return next(error);
        }
        console.log('before' , req.user.activityBlogKey);
        req.user.activityBlogKey = blogId;
        console.log('after' , req.user.activityBlogKey);
        var msg = {
            code : 200,
            msg : 'Success'
        };
        res.status(msg.code).json(msg);
    });
};

