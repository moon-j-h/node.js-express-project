var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var User = require('./Users');

var blogSchema = new Schema({
    _user: {type: Schema.Types.ObjectId, ref: 'User'},
    type: {                         /// 0(개인) 1(공간)
        type: Number,
        default: 0
    },
    bgPhoto: {
        type: String,
        default: 'https://s3-ap-northeast-1.amazonaws.com/indeepen-s3/images/bgs/default_bg.png'
    },
    nick: String,
    profilePhoto: {
        type: String,
        default: 'https://s3-ap-northeast-1.amazonaws.com/indeepen-s3/images/profiles/icon-cafe.jpg'
    },
    intro: String,
    phone: String,
    email: String,
    iMissYous: [{type: Schema.Types.ObjectId, ref: 'Blog'}],
    fans: [{type: Schema.Types.ObjectId, ref: 'Blog'}],
    location: {
        point: {
            type: {
                type: String,
                default: 'Point'
            },
            coordinates: [Number]
        },
        address: String
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    updateAt: {
        type: Date,
        default: Date.now
    },
    isActivated: {
        type: Boolean,
        default: true
    }
}, {versionKey: false});

blogSchema.statics = {
    // 댓글 달때 사용자 id 편하게 하기 위해 한 것. 나중에 지워....// 네....
    findBlogs: function (callback) {
        return this.find().exec(callback);
    },
    saveBlog: function (blogInfo, callback) {
        return this.create(blogInfo, callback);
    },
    findUserIdOfBlog: function (blogId, callback) {
        this.findOne({_id: new ObjectId(blogId), type: 0}).
        select('-_id -type -bgPhoto -nick -profilePhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated').
        exec(callback);
    },
    findBlogsOfUser: function (userId, callback) {
        this.find({_user: new ObjectId(userId)}).
        select('-_user -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt').
        exec(callback);
    },
    findBlogIdOfUser: function (userId, callback) {
        this.find({_user: new ObjectId(userId)}).
        select('-_user -bgPhoto -nick -profilePhoto -intro -iMissYous -fans -location -createAt -updateAt').
        exec(callback);
    },
    findOneBlog: function (blogId, callback) {
        this.findOne({_id: new ObjectId(blogId)}).
        select('-intro -location -createAt -updateAt -isActivated').
        exec(callback);
    },
    findFansOfBlog: function (blogId, page, callback) { // pagination 추가
        this.aggregate([{
            $match: {_id: new ObjectId(blogId)}
        }, {
            $unwind: '$fans'
        }, {
            // $project : {_id : 0, _user : -1, nick : -1, isActivated : -1, updateAt : -1, createAt : -1, location : -1, iMissYous : -1, profilePhoto : -1, bgPhoto : -1, type : -1}
            $project: {_id: "$fans"}
        }]).
        skip(page.from).
        limit(page.to).
        exec(function (err, docs) {
            mongoose.model('Blog', blogSchema).populate(docs, {
                path: '_id',
                select: '-type -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'
            }, callback);
        });
    },
    findIMissYousOfBlog: function (blogId, page, callback) {  //pagination 추가
        this.aggregate([{
            $match: {_id: new ObjectId(blogId)}
        }, {
            $unwind: '$iMissYous'
        }, {
            // $project : {_id : 0, _user : -1, nick : -1, isActivated : -1, updateAt : -1, createAt : -1, location : -1, iMissYous : -1, profilePhoto : -1, bgPhoto : -1, type : -1}
            $project: {_id: "$iMissYous"}
        }]).
        skip(page.from).
        limit(page.to).
        exec(function (err, docs) {
            mongoose.model('Blog', blogSchema).populate(docs, {
                path: '_id',
                select: '-type -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'
            }, callback);
        });
    },
    findProfileOfArtistBlog: function (blogId, callback) {
        this.findOne({_id: new ObjectId(blogId)}).
        select('-type -bgPhoto -nick -profilePhoto -iMissYous -fans -location -createAt -updateAt -isActivated').
        populate('_user', '-hashed_password -salt -phone -myArtists -profilePhoto -intro -createAt -updateAt').
        exec(callback);
    },

    //공용
    updateProfileOfBlog: function (blogId, newInfo, callback) {
        this.findOneAndUpdate({_id: new ObjectId(blogId)}, {$set: newInfo}, callback);
    },
    findProfilePhotoOfBlog: function (blogId, callback) {
        this.findOne({_id: new ObjectId(blogId)}).
        select('-_id -_user -type -bgPhoto -nick -intro -fans -iMissYous -location -createAt -updateAt -isActivated').
        exec(callback);
    },
    updateProfilePhotoOfBlog: function (blogId, newUrl, callback) {
        console.log('blogId ', blogId);
        this.findOneAndUpdate({_id: new ObjectId(blogId)}, {$set: {profilePhoto: newUrl}}, callback);
    },
    updateBgPhotoOfBlog: function (blogId, newUrl, callback) {
        this.findOneAndUpdate({_id: new ObjectId(blogId)}, {$set: {bgPhoto: newUrl}}, callback);
    },
    pushFanToBlog: function (blogId, userBlogId, callback) {
        this.findOne({_id: new ObjectId(blogId)}, function (err, doc) {
            if (err) {
                callback(err, null);
            } else {
                doc.fans.unshift(new ObjectId(userBlogId));
                console.log('pushFanToBlog ', doc);
                doc.save(callback);
            }
        });
    },
    pullFanFromBlog: function (blogId, userBlogId, callback) {
        return this.findOneAndUpdate({_id: new ObjectId(blogId)}, {$pull: {fans: new ObjectId(userBlogId)}}, callback);
    },
    pushIMissYouToBlog: function (blogId, userBlogId, callback) {
        this.findOne({_id: new ObjectId(blogId)}, function (err, doc) {
            if (err) {
                callback(err, null);
            } else {
                doc.iMissYous.unshift(new ObjectId(userBlogId));
                doc.save(callback);
            }
        });
    },
    isAlreadyDone : function(blogId, userBlogId, at, callback){
        var options;
        if(at === 'fan'){
            // fan
            options = {_id : ObjectId(blogId), fans : ObjectId(userBlogId)};
        }else{
            // iMissYou
            options = {_id : ObjectId(blogId), iMissYous : ObjectId(userBlogId)};
        }
        this.count(options, callback);
    },
    removeBlog: function (blogId, callback) {
        return this.findOneAndRemove({_id: new ObjectId(blogId)}, callback);
    },
    updateIsActivated: function (userId, blogId, callback) {
        var that = this;
        this.update({_user: new ObjectId(userId)}, {$set: {isActivated: false}}, {multi: true}, function (err, docs) {
            if (err) {
                callback(err, null);
            } else {
                that.findOneAndUpdate({_id: new ObjectId(blogId)}, {$set: {isActivated: true}}, callback);
            }
        });
    },
    findLocation: function (blogId, callback) {
        return this.findOne({_id: new ObjectId(blogId)})
            .select('location')
            .exec(callback);
    },
    findProfileOfSpaceBlog: function (blogId, callback) {
        return this.findOne({_id: new Object(blogId)})
            .select('-type  -bgPhoto -profilePhoto -iMissYous -fans -location -createAt -updateAt -isActivated')
            .exec(callback);
    },
    findAllBlogsNick: function (callback) {
        return this.find()
            .select('-bgPhoto -profilePhoto -intro -phone -email -iMissYous -fans -location -createAt -updateAt')
            .populate({
                path: '_user',
                select: '-provider -hashed_password -salt -authToken -facebook -profilePhoto -intro -phone -myArtists -createAt -updateAt'
            })
            .exec(callback);
    },
    // search
    findBlogIds: function (key, type, callback) {
        this.find({nick: {$regex: key}, type: type})
            .select('-_user -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated -phone -email')
            .exec(callback);
    },
    //temperory
    findAllBlogs: function (callback) {
        this.find()
            .select(' -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated -profilePhoto')
            .populate('_user', 'email')
            .exec(callback);
    }
};


module.exports = mongoose.model('Blog', blogSchema);