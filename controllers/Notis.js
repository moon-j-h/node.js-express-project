/**
 * Created by skplanet on 2015-11-24.
 */

var Noti = require('./../models/Notis');
var userKey = '5657fd407b005d2403f932b1';

module.exports.getNotis = function (req, res, next) {
    Noti.findAllByUserId(userKey, function (err, docs) {
        if (err) {
            console.error('NotiList 가져오기 실패!');
            var error = new Error('Getting Notis Failed!');
            error.code = 404;
            return next(error);
        }
        var msg = {
            msg: "success",
            code: 200,
            result: docs
        };
        res.status(msg.code).json(msg);
    });
};

module.exports.checkNoti = function (req, res, next) {
    var notiId = req.params.notiId;
    if (notiId == null) {
        console.error('NotiId를 다시 확인해줘요', err);
        var error = new Error('Noti 확인');
        error.code = 404;
        return next(error);
    }
    //console.log('notiId', notiId);
    Noti.checkNoti(notiId, function (err) {
        if (err) {
            console.error(err);
            var error = new Error('Noti 확인 실패');
            error.code = 404;
            return next(err);
        }
        var msg = {
            msg: 'check 성공',
            code: 200
        };
        res.status(msg.code).json(msg);
    });
};

