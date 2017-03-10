/**
 * Created by Moon Jung Hyun on 2015-11-17.
 */

module.exports.logout = function(req, res){
    req.logout();   // passport session 지우기
    // session 지워줌...
    req.session.destroy(function(err){
        if(err){
            console.error('ERROR DESTROY SESSION ', err);
            var error = new Error('세션 제거를 할 수 가 없.... ㅠㅜㅠㅜ');
            error.code = 400;
            return next(error);
        }
        console.log('session 제거 완료');
    });
    var msg = {
        code : 200,
        msg : 'Success'
    };
    res.status(msg.code).json(msg);
};

module.exports.loginByFB = function(req, res, next){

};