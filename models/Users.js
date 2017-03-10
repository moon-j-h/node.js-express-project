/**
 * Created by Moon Jung Hyun on 2015-11-06.
 */

var mongoose = require('mongoose');
var crypto = require('crypto');

var Blog = require('./Blogs');
var ObjectId = mongoose.Types.ObjectId;
var Schema = mongoose.Schema;
var oAuthTypes = [
    'facebook'
];

var userSchema = new mongoose.Schema({
    email: {type : String, unique : true},
    //password : String,
    name: String,
    nick: {
        type : String,
        trim : true
    },
    provider : String,
    hashed_password : String,
    salt : String,
    authToken : String,
    facebook : {},
    profilePhoto: {
        type : String,
        default : 'https://s3-ap-northeast-1.amazonaws.com/indeepen-s3/images/profiles/icon-person.jpg'
    },
    intro: {type : String, trim : true},
    phone: {type : String, trim : true},
    myArtists : [{type : Schema.Types.ObjectId, ref:'Blog'}],
    createAt: {
        type: Date,
        default: Date.now
    },
    updateAt : {
        type : Date,
        default : Date.now
    },

    isPublic: {
        type: Boolean,
        default: true
    }
}, { versionKey: false });

/**
 *  Virtual
 */
userSchema
    .virtual('password')
    .set(function(password){
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function(){return this._password});


userSchema.methods = {
    /**
     * 암호 일치 여부 확인
     * @param text
     * @returns {boolean}
     */
    authenticate : function(text){
        return this.encryptPassword(text) === this.hashed_password;
    },
    /**
     * 양념 뿌리기 ㅋㅋ
     * @returns {string}
     */
    makeSalt : function(){
        return Math.round((new Date().valueOf() * Math.random())) + '';
    },
    encryptPassword : function(password){
        if(!password) return '';
        try{
            return crypto
                .createHmac('sha1', this.salt)
                .update(password)
                .digest('hex');
        }catch(err){
            return '';
        }
    }
};

userSchema.statics = {
    saveUser : function(userInfo, callback){
        return this.create(userInfo, callback);
    },
    updateProfileAtArtistBlog : function(userId, newInfo, callback){
        this.findOneAndUpdate({_id : ObjectId(userId)}, {$set : newInfo}, callback);
    },
    updateProfilePhoto : function(userId, newUrl, callback){
        this.findOneAndUpdate({_id : ObjectId(userId)}, {$set : {profilePhoto : newUrl}}, callback);
    },
    findMyArtistIds : function(userId, callback){
        this.findOne({_id : ObjectId(userId)}).
            select('-_id -email -hashed_password -salt -name -nick -profilePhoto -intro -phone -createAt -updateAt -isPublic').
            exec(callback);
    },
    findMyArtists : function(userId, page, callback){
        this.aggregate([{
            $match : {_id : ObjectId(userId)}
        },{
            $unwind : '$myArtists'
        },{
            $project : {_id : '$myArtists'}
        }]).
            skip(page.from).
            limit(page.to).
            exec(function(err, docs){
                Blog.populate(docs, {path : '_id', select : '-type -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'}, callback);
            });
    },
    pushMyArtists : function(userId, blogId, callback) {
        this.findOne({_id: ObjectId(userId)}, function (err, doc) {
            if(err){
                callback(err, null);
            }else{
                doc.myArtists.unshift(ObjectId(blogId));
                doc.save(callback);
            }
        });
    },
    pullMyArtists : function(userId, blogId, callback){
        this.findOneAndUpdate({_id : ObjectId(userId)}, {$pull : {myArtists : ObjectId(blogId)}}, callback);
    },
    isExistEmail : function(email, callback){
        this.findOne({email : email}, function(err, doc){
            if(doc == null){
                callback(err, false);
            }else{
                callback(err, true);
            }
        });
    },
    updatePassword : function(userId, pw, callback){
        //this.update({_id : ObjectId(userId)}, {$set : {password : pw.newPw}}, callback);
        this.findOne({_id : ObjectId(userId)}, function(err, doc){
            if(err){
                callback(err, null);
            }else{
                doc._password = pw.newPw;
                doc.salt = doc.makeSalt();
                doc.hashed_password = doc.encryptPassword(pw.newPw);
                doc.save(callback);
            }
        });
    },
    findUser : function(options, callback){
        options.select = options.select || '_id';
        this.findOne(options.criteria)
            .select(options.select)
            .exec(callback);
    }
};

module.exports = mongoose.model('User', userSchema);