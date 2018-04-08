var mongoose=require('mongoose');
module.exports=mongoose.model('messages',{
  username:{ type: String},
  seconduser:{ type: String},
  seen_now:{ type: String},
  message:Array,
  timestamp:{type:Date,default:Date.now}
});
