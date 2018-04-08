
var mongoose = require('mongoose');

module.exports = mongoose.model('notifications',{
	username:String,
  notifications:Array
});
