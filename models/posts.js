var mongoose=require('mongoose');
module.exports=mongoose.model('posts',{
  timestamp:{type:Date,default:Date.now},
  username:String,
  image:String,
  status:String,
  love:Array,
  haha:Array
});
