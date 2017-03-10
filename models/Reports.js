/**
 * Created by Moon Jung Hyun on 2015-11-07.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var Post = require('./Posts');
var User = require('./Blogs');

var reportSchema = new Schema({
    _post : {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    _reporter : {
        type : Schema.Types.ObjectId,
        ref : 'Blog'
    },
    createAt : {
        type : Date,
        default : Date.now
    }
}, {versionKey : false});

reportSchema.statics = {
    saveReport : function(postId, blogId, callback){
        var reportInfo = {
            _post : new ObjectId(postId),
            _reporter : new ObjectId(blogId)
        };
        this.create(reportInfo, callback);
    },
    isReported : function(postId, blogId, callback){
        this.findOne({_post : new ObjectId(postId), _reporter : new ObjectId(blogId)}, function(err, doc){
            if(err){
                callback(err, null);
            }else{
                if(doc){
                    callback(null, true);
                }else{
                    callback(null, false);
                }
            }
        });
    },
    findReport : function(reportId, callback){
        this.findOne({_id : new ObjectId(reportId)})
            .exec(callback);
    },
    findReportsOfPost : function(postId, callback){
        this.find({_post : new ObjectId(postId)})
            .sort({createAt : -1})
            .exec(callback);
    }
};

module.exports = mongoose.model('Report', reportSchema);
