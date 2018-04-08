
var mongoose = require('mongoose');

module.exports = mongoose.model('user',{
	id: String,
	username: String,
	password: String,
	email: String,
	name: String
});
