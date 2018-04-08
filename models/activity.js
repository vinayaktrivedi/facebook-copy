var mongoose=require('mongoose');
module.exports=mongoose.model('activity',{
  username:String,
  timestamp:{type:Date,default:Date.now},
  post_id:String,
  type:String
});
