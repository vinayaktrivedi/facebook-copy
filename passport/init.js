var Local=require('passport-local').Strategy;
var user=require('../models/user');
var crypt=require('bcrypt-nodejs');
module.exports=function(passport){
  passport.serializeUser(function(user,done){
    console.log('serializing user: ');console.log(user);
    done(null,user._id);
  });
  passport.deserializeUser(function(id,done){
    user.findById(id,function(err,user){
      console.log('deserializing user: ');console.log(user);
      done(err,user);
    });
  });
  var validpassword=function(user,password){
    return crypt.compareSync(password,user.password);
  };
  passport.use('signin',new Local({
    passReqToCallback:true
  },
  function(req,username,password,done){
    process.nextTick(function(){
      user.findOne({'username':username},
        function(err,user){
          if(err)
            return done(err);
          if(!user){
            return done(null,false);
          }
          if(!validpassword(user,password)){
            return done(null,false);
          }
          req.session.regenerate(function(){
            req.session.user=username;
            req.session.success='Authenticated';
            
          });
          return done(null,user);
        });
    });
  }));
  var generateHash=function(password){
     return crypt.hashSync(password, crypt.genSaltSync(10), null);
  }
 passport.use('signup',new Local({ passReqToCallback:true},function(req,username,password,done){
      process.nextTick(function(){
        user.findOne({'username':username},function(err,user){
          if(err){
            return done(err);
          }
          if(user){

            return done(null,false);

          }

        });
        var newuser= new user();
        newuser.username=username;
        newuser.password=generateHash(password);
        if (!req.body.name) {
          return done("No Name Sent");

        }
        newuser.name = req.body.name;
        if (!req.body.email) {
          return done("No Email Sent");
        }
        newuser.email=req.body.email;
        newuser.save(function(err){
          if(err){
          return done(err,null);
        }
          return done(null,newuser);
        });
      });
 }));
}
