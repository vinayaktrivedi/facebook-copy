
var mongoose = require('mongoose');

module.exports = mongoose.model('friend',{
	username:String,
  friends:Array
});
