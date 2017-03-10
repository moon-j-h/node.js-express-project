var mongoose = require('mongoose');

var counterSchema = new mongoose.Schema({
	_id : String,
	seq : Number
}, {versionKey: false});

module.exports = mongoose.model('Counter', counterSchema);