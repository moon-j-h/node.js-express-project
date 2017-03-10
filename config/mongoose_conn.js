var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:3000/indeepen');
module.exports = mongoose;