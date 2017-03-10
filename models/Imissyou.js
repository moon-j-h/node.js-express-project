var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var iMissYouSchema = new Schema({
	_id : Number,
    _blog : {
        type : Number,
        ref : 'Blog'
    },
    year : Number,
    month : Number,
    iMissYous : [{
        _user : {
            type : Number,
            ref : 'User'
        },
        addAt : {
            type: Date,
            default: Date.now
        }
    }],
    isValid :{
        type : Boolean,
        default : true
    }
});

module.exports = mongoose.model('iMissYou', iMissYouSchema);