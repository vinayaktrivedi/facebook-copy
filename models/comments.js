var mongoose=require('mongoose');
module.exports=mongoose.model('comments',{
    post_id:String,
    replies:Array,
    timestamp:{type:Date,default:Date.now()},
    description:String,
    username:String,
    name:String
});
