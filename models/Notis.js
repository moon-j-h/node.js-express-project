var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var Post = require('./Posts');
var Blog = require('./Blogs');
var User = require('./Users');

var userKey = "5657fd407b005d2403f932b2"; //김네임 blog

var notiSchema = new Schema({

    _who: {
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    },
    _receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    where: String,
    what: Number, // 0 : 위치없음 1 : 문화, 2 : 예술, 3 : 개인 블로그 , 4 : 공간 블로그,  5: 협력제안,
    how: Number, // 0 : 좋아요, 1: 댓글, 2: 내 팬, 3: imissyou, 4: tag
    isChecked: {
        type: Boolean,
        default: false
    },
    createAt: {
        type: Date,
        default: Date.now()
    }
}, {versionKey: false});

notiSchema.statics = {
    findAll: function (callback) {
        this.find()
            .exec(callback);
    },
    findAllByUserId: function (userId, callback) {
        this.find({'_receiver': userId})
            .sort({createAt: -1})
            .exec(callback);
    },
    saveNoti: function (userId, where, what, how, callback) {
        //var who = req.session.userId;
        var notiInfo = {
            _who: userKey, //작성자 session에서 가져옴
            _receiver: userId,
            where: where,
            what: what,
            how: how
        };
        //console.log(notiInfo);
        return this.create(notiInfo, callback);
    },
    checkNoti: function (notiId, callback) {
        this.findOneAndUpdate({'_id': notiId}, {$set: {"isChecked": true}})
            .exec(callback);
    }

};

module.exports = mongoose.model('Noti', notiSchema);
