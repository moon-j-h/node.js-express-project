/**
 * Created by Moon Jung Hyun on 2015-11-06.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var Blog = require('./Blogs');
var HashTag = require('./HashTags');
var Noti = require('./Notis');

var postSchema = new Schema({
    postType : Number, // 0(일반 - work), 1(문화예술 - show),
    createAt : {
        type : Date,
        default : Date.now
    },
    updateAt : {
        type : Date,
        default : Date.now
    },
    _writer : {   // Blog에서 user_id, nick, profile_photo  가져옴
        type : Schema.Types.ObjectId,
        ref : 'Blog'
    },
    content : {type : String, trim : true},
    hashTags : [{type : String, trim : true}],
    likes : [{type : Schema.Types.ObjectId, ref : 'Blog'}],
    work : {
        type : {type : Number}, // 0(그림), 1(사진), 2(음악), 3(영상예술)
        emotion : Number//0(감정없음), 1(기쁨), 2(사랑), 3(슬픔),4( 화남)
    },
    show : {
        title : {type : String, trim : true},
        type : {type : Number}, // 0(전시), 1(공연), 2(상영), 3(예술모임), 4(패스티벌)
        tags : [{
            _user : {  // Blog에서 user_id, nick, profile_photo 가져옴
                type : Schema.Types.ObjectId,
                ref : 'Blog'
            },
            point : {
                x : {type: Number ,default : '0'},
                y : {type: Number ,default : '0'}
            }
        }],
        startDate : String,
        endDate : String,
        startTime : {type : String, trim : true},
        endTime : {type : String, trim : true},
        fee : Number,
        location : {
            point : {
                type : {
                    type : String,
                    default : 'Point'
                },
                coordinates : [Number]
            },
            address : {type : String, trim : true}
        }
    },
    youTube : String,
    resources : [{
        _id : false,
        type : {type : String},            //0(이미지), 1(동영상), 2(음원)
        originalPath : String,      // 영상, 음원이 thumbnail 사용 안하면 여기다가 저장
        thumbnailPath : String
    }]
}, {versionKey : false});

/**
 * Post 를 저장 한 후 hashTag 가 있으면
 * hashTags Collection 에도 저장한다.
 */
postSchema.post('save', function(doc){
    var hashTag = doc.hashTags;
    console.log('hashTag', hashTag);
    if(hashTag.length != 0){
        hashTag.forEach(function(tag){
            //console.log('tag ', tag);
            HashTag.updateIncCntById(tag, function(err, doc){
                if(err){
                    console.error('ERROR HASH TAG INC ', err);
                    return;
                }
                //console.log('hash tag doc', doc);
            });
        });
    }//if
    var tags = doc.show.tags;
    if(tags.length != 0){
        tags.forEach(function(tag){
           //console.log('tags artists UserId! : ' ,tag._user);
            //BlogId로 UserId찾기
            Blog.findUserIdOfBlog(tag._user,function(err,result){
               if(err) {
                   console.error('Getting UserId by BlogId Failed', err);
                   var error = new Error('userId를 가져올 수 없습니다');
                   error.code = 404;
                   return next(err);
               }
                //console.log('UserId via BlogId : ',doc);
                //postId넘기기
                Noti.saveNoti(result._user,doc._id, 1, 4,function(err,doc){
                    if(err){
                        console.error('error',err);
                        var error = new Error('Noti를 생성 실패');
                        error.code = 404;
                        return next(err);
                    }
                });//notiSave
            });
        });//forEach
    }//if

});

/**
 * Post 를 제거하면 hashTag 의 cnt 를 1 감소한다.
 */
postSchema.post('remove', function(doc){
    console.log('remove hook');
    console.log('doc ', doc);
    var hashTags = doc.hashTags;
    if(hashTags.length != 0){
        hashTags.forEach(function(hash){
           console.log('hash');
            HashTag.updateDecCntById(hash, function(err, doc){
                if(err){
                    console.error('ERROR HASH TAG DEC ', err);
                    return;
                }
                console.log('hash tag doc', doc);
            })
        });
    }
});

/*
    method
 */
postSchema.methods = {
    /**
     * 해당 postType 의 Post 만 가져오기
     * @param callback
     * @returns {Promise}
     */
    findByPostType : function(options,lastSeen, field, callback){
        if(!options) options = {};
        var select = '';
        console.log(field);
        if(lastSeen == null){
            if(this.postType == 0)
                //select = '_id createAt _writer content likes work resources';
                select = '-updateAt -hashTags -show';
            else
                select = '-content -hashTags -work -show.location.point'; //-수정
            this.model('Post').find(options).
            where('postType').
            equals(this.postType).
            select(select).
            sort({createAt : -1}).
            limit(10).
            populate({path : '_writer', select : '-bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'}).
            //populate({path : 'likes', select : '_id _user nick profilePhoto'}).
            populate('show.tags._user', '_id _user nick profilePhoto type').
            exec(callback);
        }else{
            this.model('Post').find({_id : {$lt : lastSeen}}).
            where('postType').
            equals(this.postType).
            select(select).
            sort({createAt : -1}).
            limit(10).
            populate({path : '_writer', select : '-bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'}).
            //populate({path : 'likes', select : '_id _user nick profilePhoto'}).
            populate('show.tags._user', '_id _user nick profilePhoto type').
            exec(callback);
        }
    }
};

/*
    Statics
 */
postSchema.statics = {
    /**
     * 특정 post의 상세정보 가져오기
     * @param postId
     * @param callback
     * @returns {Promise}
     */
    findPost : function(postId, postType, callback){
        var select = '';
        if(postType == 0){
            //select ='createAt _writer content likes work resources postType';
            select = '-resources.thumbnailPath -show -hashTags -updateAt'
        }else{
            //select = 'createAt _writer content likes show resources postType';
            select = '-resources.thumbnailPath -work -hashTags -updateAt';
        }
        return this.findOne({_id : new ObjectId(postId)}).
            select(select).
            populate('_writer', '_id _user nick profilePhoto type').
            populate('show.tags._user', '_id _user nick profilePhoto type').
            sort({createAt : -1}).
            exec(callback);

    },
    /**
     * hashTag 가 일치하는 post 들 가져오기
     * @param hashTag
     * @param type
     * @param lastSeen
     * @param callback
     */
    findPostsByHashTag : function(hashTag, type, lastSeen, callback){
        var options={hashTags : hashTag, postType : 0};
        var select='-postType -content -_writer -createAt -updateAt -hashTags -likes -work.emotion -show -resources.originalPath';
        var perPage = 15;

        if(type != 0){
            if(type == 1)
                perPage = null;
            else
                perPage = 10;
            select = '-updateAt -hashTags -show -resources.originalPath';
        }
        if(lastSeen){
            if(type == 1)
                options['_id'] = {$gte : lastSeen};
            else
                options['_id'] = {$lt : lastSeen};
        }
        this.find(options).
            sort({createAt : -1}).
            select(select).
            limit(perPage).
            populate('_writer', '-bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated').
            exec(callback);
    },
    /**
     * 모든 type의 posts 가져오기 (fan page)
     * @param userBlogId
     * @param userArtists
     * @param lastSeen
     * @param callback
     */
    findPostsAtFanPage : function(userBlogId, userArtists, emotion, field, lastSeen, callback){
        var options = {$or : [{$and : [{_writer : new ObjectId(userBlogId)}, {postType : 0}]},{_writer : {$in : userArtists}}]};
        if(emotion && field){
            console.log('both');
            if(field == 12) { // 음악
                options['work.emotion'] = emotion;
                options['work.type'] = {'$in' : [12,13,14]};
            }else if(field == 16) {// 문화
                options['work.emotion'] = emotion;
                options['postType'] = 1;
            }else {
                options['work.emotion'] = emotion;
                options['work.type'] = field;
            }
        }else if(emotion){
            console.log('emotion');
            options['work.emotion'] = emotion;
        }else if(field){
            console.log('field');
            if(field == 12)  // 음악
                options['work.type'] = {'$in' : [12,13,14]};
            else if(field == 16) // 문화
                options['postType'] = 1;
            else
                options['work.type'] = field;
        }

        if(lastSeen != null)
            options['_id'] = {$lt : lastSeen};

        this.find(options).
            sort({createAt : -1}).
            select('-updateAt -hashTags -show.location.point -resources.originalPath').
            limit(10).
            populate('_writer', '-bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated').
            populate('show.tags._user', '-_user -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated').
            exec(callback);
    },
    /**
     * Post정보 저장하기
     * @param postInfo
     * @param callback
     * @returns {postInfo}
     */
    savePost : function(postInfo, callback){
        return this.create(postInfo, callback);
    },
    /**
     * 해당 Post 의 좋아요에 회원 blogId 추가하기
     * @param postId
     * @param blogId
     * @param callback
     * @returns {Query|*}
     */
    pushLike : function(postId, blogId, callback){
        return this.findOneAndUpdate({_id : new ObjectId(postId)}, {$push : {likes : new ObjectId(blogId)}}, callback);
    },
    /**
     * 해당 Post 의 좋아요에 회원 blogId 제거하기
     * @param postId
     * @param blogId
     * @param callback
     * @returns {Query|*}
     */
    pullLike : function(postId, blogId, callback){
        return this.findOneAndUpdate({_id : new ObjectId(postId)}, {$pull : {likes : new ObjectId(blogId)}}, callback);
    },
    isLiked : function(postId, blogId, callback){
        this.count({_id : ObjectId(postId), likes : ObjectId(blogId)}, callback);
    },
    removePost : function(postId, callback){
        //this.findOneAndRemove({_id : new ObjectId(postId)}, callback);
        this.findOne({_id : new ObjectId(postId)}, function(err, doc){
            if(err){
                callback(err, null);
            }else{
                console.log('doc ',doc);
                doc.remove(callback);
            }
        });
    },
    /**
     * 해당 blogger 가 등록한 workPost 가져오기
     * @param writer
     * @param type
     * @param lastSeen
     * @param callback
     */
    findWorkPostsAtBlog : function(writer, type,lastSeen, callback){
        var options = {_writer : new ObjectId(writer), postType : 0};
        var select = '-postType -content -_writer -createAt -updateAt -hashTags -likes -work.emotion -show -resources.originalPath';
        var perPage = 15;
        if(type != 0){
            if(type ==1)
                perPage = null;
            else
                perPage = 10;
            select = '-updateAt -hashTags -show -resources.originalPath';
        }
        if(lastSeen){
            if(type == 1)
                options['_id'] = {$gte : lastSeen};
            else
                options['_id'] = {$lt : lastSeen};
        }
        this.find(options).
            sort({createAt : -1}).
            select(select).
            limit(perPage).
            populate('_writer', '-bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated').
            exec(callback);
    },
    /**
     * 해당 blogger 가 좋아요 한 workPosts 가져오기
     * @param artistBlogId
     * @param type
     * @param lastSeen
     * @param callback
     */
    findLikePostsAtBlog : function(artistBlogId, type, lastSeen, callback){
        var options = {likes : new ObjectId(artistBlogId), postType : 0};
        var select = '-postType -content -_writer -createAt -updateAt -hashTags -likes -work.emotion -show -resources.originalPath';
        var perPage = 15;
        if(type != 0){
            if(type ==1)
                perPage = null;
            else
                perPage = 10;
            select = '-updateAt -hashTags -show -resources.originalPath';
        }
        if(lastSeen){
            if(type == 1)
                options['_id'] = {$gte : lastSeen};
            else
                options['_id'] = {$lt : lastSeen};
        }
        this.find(options).
            sort({createAt : -1}).
            select(select).
            limit(perPage).
            populate('_writer', '-bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated').
            exec(callback);
    },
    findRecommendWorkPosts : function(blogId, myArtists, type, lastSeen, callback){
        var options = {likes : {$in : myArtists}, postType : 0, _writer : {$nin : blogId}};
        if(myArtists.length == 0)
            options = {postType : 0, _writer : {$nin : blogId}};
        var perPage = 15;
        var select = '-postType -content -_writer -createAt -updateAt -hashTags -likes -work.emotion -show -resources.originalPath';
        if(type != 0){
            if(type ==1)
                perPage = null;
            else
                perPage = 10;
            select = '-updateAt -hashTags -show -resources.originalPath';
        }
        if(lastSeen){
            if(type == 1)
                options['_id'] = {$gte : lastSeen};
            else
                options['_id'] = {$lt : lastSeen};
        }
        this.find(options).
            sort({createAt : -1}).
            select(select).
            limit(perPage).
            populate('_writer', '-bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated').
            exec(callback);
    },
    hell: function (region, startDate, endDate, field, lastSeen, callback) {
        // 조건이 없을 때 처리
        // like 검색
        var options = {$and: [{postType: 1}]};
        if (field != null) {
            options.$and.push({'show.type': parseInt(field)});
        }
        if (region != null) {
            region = region.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
            options.$and.push({'show.location.address': {$regex: region}});
        }
        if (startDate != null && endDate != null) {
            options.$and.push({
                $and: [
                    {
                        "show.startDate": {
                            "$lte": endDate
                        }
                    }, {
                        "show.endDate": {
                            "$gte": startDate
                        }
                    }]
            });
        }//if
        if (lastSeen != null){
            options.$and.push({_id: {$lt: lastSeen}});
        }
        console.log('option : ', options);
        var select = '-content -hashTags -work -show.location.point -show.resources.originalPath';
            this.find(options).
            select(select).
            sort({createAt: -1}).
            limit(10).
            populate({
                path: '_writer',
                select: '-type -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'
            }).
            //populate({path : 'likes', select : '_id _user nick profilePhoto'}).
            populate('show.tags._user', '_id _user nick profilePhoto').
            exec(callback);
        },
    myShow : function (blogId, lastSeen, callback){
        var options = {$or : [{$and : [{'postType':1},{'show.tags._user' : blogId}]},{$and : [{'postType' : 1}, {'_writer' : blogId}]
        }]};
        var select = '-content -hashTags -work -show.location.point';
        if (lastSeen != null){
            options = {$or : [{$and : [{_id: {$lt: lastSeen}},{'postType':1},{'show.tags._user' : blogId}]},{$and : [{_id: {$lt: lastSeen}},{'postType' : 1}, {'_writer' : blogId}]
            }]};
        }
        console.log('lastSeen : ',lastSeen);
        console.log('option : ', options);
        this.find(options).
        select(select).
        sort({createAt: -1}).
        limit(10).
        populate({
            path: '_writer',
            select: '-type -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'
        }).
        //populate({path : 'likes', select : '_id _user nick profilePhoto'}).
        populate('show.tags._user', '_id _user nick profilePhoto').
        exec(callback);
    },
    likedShow : function (blogId, lastSeen,callback){
        var options = {$and : [{'likes' : blogId},{'postType':1}]};
        var select = '-content -hashTags -work -show.location.point';
        if (lastSeen != null){
            options = {$and : [{_id: {$lt: lastSeen}},{'likes' : blogId},{'postType':1}]};
        }
        console.log('lastSeen : ',lastSeen);
        console.log('option : ', options);
        this.find(options).
        select(select).
        sort({createAt: -1}).
        limit(10).
        populate({
            path: '_writer',
            select: '-type -bgPhoto -intro -iMissYous -fans -location -createAt -updateAt -isActivated'
        }).
        //populate({path : 'likes', select : '_id _user nick profilePhoto'}).
        populate('show.tags._user', '_id _user nick profilePhoto').
        exec(callback);
    }
};

module.exports = mongoose.model('Post', postSchema);

