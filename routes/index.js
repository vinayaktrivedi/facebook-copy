var express = require('express');
var router = express.Router();
var cookieparser=require('cookie');
var messages=require('../models/messages');
var multer=require('multer');
var friend=require('../models/friend');
var user=require('../models/user');
var bodyParser=require('body-parser');
var sockets={};
var imagename;
var authenticated={};
var reverse={};
var chat={};
var reference={};
var activity=require('../models/activity');
var posts=require('../models/posts');
var comments=require('../models/comments');
var notifications=require('../models/notifications');
var isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()){
    var agent=req.header('user-agent');
    var ip=req.connection.remoteAddress;
    var string=ip+agent;
    authenticated[string]=req.user.username;
		return next();
  }
	res.redirect('/timeline');
}
var makename = function (req,res,next){
	imagename = req.user.username + new Date();
	return next();
}
var istrue=function(req,res,next){
  if(!req.isAuthenticated())
  return next();
  res.redirect('/timeline');
}
module.exports=function(passport,io) {
  router.get('/',istrue,function(req,res){
   res.render('index');
  });
  router.post('/login',passport.authenticate('signin',{
    successRedirect: '/timeline',
   failureRedirect: '/signup'
  }));
  router.get('/signup',function(req,res){
      if(!req.isAuthenticated()){
      res.render('index');
    }
      else {
      res.redirect('/');
    }
  });
  var storage=multer.diskStorage(
    {destination:function(req,file,cb){
      cb(null,'/home/vinayak/Desktop/facebook_copy/myself/views/images/');
    },
    filename:function(req,file,cb){
      cb(null,req.user.username+'.jpg');
    }
  });
  var storagenew = multer.diskStorage(
    {destination:function(req,file,cb){
      cb(null,'/home/vinayak/Desktop/facebook_copy/myself/views/images/');
    },
    filename:function(req,file,cb){
      cb(null,imagename);
    }
  });
  var filter=function(req,file,cb){
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
  };
  var size=function(req,file,cb){
    if(file.size>102400){
      return cb(new Error('Max Limit crossed!'),false);
    }
      cb(null,true);
  }
  var uploadnew=multer({storage:storagenew,fileFilter:filter,limits:size});
  var upload=multer({storage:storage,fileFilter:filter,limits:size});
  router.post('/upload',isAuthenticated, upload.single('profile_pic'),function(req,res){
      res.redirect('/timeline');
  });
  router.post('/signup',passport.authenticate('signup',{
    successRedirect: '/timeline',
   failureRedirect: '/signup'
  }));
  router.post('/sendmsg',isAuthenticated,function(req,res){
      var a;
      var id=req.body.id;
      var msg=req.body.msg;
      var msg1="You : "+msg;
      var msg2=req.user.username+" : "+msg;
			var time=new Date();
			console.log(msg1+msg2);
      var query=messages.find({username:req.user.username,seconduser:id}).select('message');
      query.exec(function(err,msg){
        if(msg[0]!=undefined){
         a=msg[0]['message'];
         a.push(msg1);
         messages.update({username:req.user.username,seconduser:id},{'message':a,'seen_now':'FALSE','timestamp':time},{multi:true},function(err){
           if(err){
             throw err;
           }
       });
        }
        else{
         a=new Array();
         a.push(msg1);
         var x=new messages();
         x.username=req.user.username;
         x.seconduser=id;
         x.message=a;
				 x.seen_now='FALSE';
         x.save(function(err){
					 if(err){
						 console.log(err);
					 }
         });
       }
      });
      query=messages.find({username:id,seconduser:req.user.username}).select('message');
      query.exec(function(err,msg){
        if(msg[0]!=undefined){
         a=msg[0]['message'];
         a.push(msg2);
         messages.update({username:id,seconduser:req.user.username},{'message':a,'seen_now':'TRUE','timestamp':time},{multi:true},function(err){
           if(err){
             throw err;
           }
       });
        }
        else{
         a=new Array();
         a.push(msg2);
         var x=new messages();
         x.username=id;
         x.seconduser=req.user.username;
         x.message=a;
				 x.seen_now='TRUE';
         x.save(function(err){
         });
       }
      });
      if(sockets[id]!=undefined){
      io.to(sockets[id]).emit('newmsg',{'data':msg2,'first':id,'second':req.user.username});
    }
      io.to(sockets[req.user.username]).emit('newmsg',{'data':msg1,'first':id,'second':req.user.username});
    res.end('success');
  });

  io.sockets.on('connection',function(socket){
   var agent=socket.handshake.headers['user-agent'];
   var ip= socket.request.connection.remoteAddress;
   if(ip=='::1'){
     ip='::ffff:127.0.0.1';
   }
   var string=ip+agent;
   if(authenticated[string]!=undefined){
		 console.log('connected');
     var x=authenticated[string];
     sockets[x]=socket.id;
		reference[x]=socket.request.headers.referer;
		 if(reference[x]=='http://127.0.0.1:3000/home'){
			 if(chat[x]!=undefined){
			io.to(socket.id).emit('initial',{friend:chat[x]});
		}
		 }

		 reverse[socket.id]=x;
   }
	 socket.on('seen',function(data){

		 var user=reverse[socket.id];
		 var date=new Date();

		 console.log(date);
		 messages.update({username:data['friend'],seconduser:user},{'seen_now':date},{multi:true},function(err){
			 if(err){
				 throw err;
			 }
	 });
	 if(sockets[data['friend']]!=undefined){
		 io.to(sockets[data['friend']]).emit('seen',{'time':date.toLocaleTimeString(),'second':user});
	 }
	 });
	 socket.on('typing',function(data){
		 var user=reverse[socket.id];
		 if(sockets[data['friend']]!=undefined&&reference[user]=='http://127.0.0.1:3000/home'){
			 io.to(sockets[data['friend']]).emit('typing',{friend:user});
		 }
	 });
	 socket.on('blur',function(data){
		 var user=reverse[socket.id];
		 if(sockets[data['friend']]!=undefined&&reference[user]=='http://127.0.0.1:3000/home'){
			 io.to(sockets[data['friend']]).emit('blur',{friend:user});
		 }
	 });
	 socket.on('disconnect',function(data){
		 
		 if(!socket.id){
			 return;
		 }
		 var user=reverse[socket.id];
		 friend.find({'username':user}).select('friends').exec(function(err,result){
		 	if(result[0] != undefined)
		 		result = result[0]['friends'];
		 	result.forEach(function(value){
		 		if(sockets[value] != undefined){
		 			io.to(sockets[value]).emit('offline',{'user':user});
		 		}
		 	});
		 });
		 delete sockets[user];
		 delete reverse[socket.id];
	 });
  });

  router.get('/home',isAuthenticated,function(req,res){
			var options = {
			maxAge: 1000 * 60 * 15, // would expire after 15 minutes
			httpOnly: true, // The cookie only accessible by the web server// Indicates if the cookie should be signed
			}
			res.cookie('user',req.user.username,options);
			res.render('home');
  });

	router.post('/fill',isAuthenticated,function(req,res){
		var query=friend.find({'username':req.user.username}).select('friends');
		var sql=user.find().select('username');
		query.exec(function(err,friend){
			if(!err){
				sql.exec(function(err,users_ava){
							if(!err){
								res.send({users:users_ava,friends:friend})
							}
				});

			}
		});
	});


	/* Function working fine */


  router.post('/friend',isAuthenticated,function(req,res){
    var id=req.body.id;
    if(id==req.user.username){
      res.redirect('/home');
    }
    else{
    var a;
    var query=friend.find({'username':req.user.username});
    query.select('friends');
    query.exec(function(err,frien){
      if(frien[0]!=undefined){
       a=frien[0]['friends'];
			 if(a.indexOf(id)>-1){
				 res.redirect('/home');
			 }
       a.push(id);
       friend.update({'username':req.user.username},{'friends':a},{multi:true},function(err){
         if(err){
           throw err;
         }
     });
      }
      else{
       a=new Array();
       a.push(id);
       var x=new friend();
       x.username=req.user.username;
       x.friends=a;
       x.save(function(err){

       });
     }
    });
   query=friend.find({'username':id});
    query.select('friends');
    query.exec(function(err,frien){
      if(frien[0]!=undefined){
       a=frien[0]['friends'];
       a.push(req.user.username);
       friend.update({'username':id},{'friends':a},{multi:true},function(err){
         if(err){
           throw err;
         }
     });
      }
      else{
       a=new Array();
       a.push(req.user.username);
       var x=new friend();
       x.username=id;
       x.friends=a;
       x.save(function(err){
       });
     }
     if(sockets[id]!=undefined){
     io.to(sockets[id]).emit('new_friend',{'friend':req.user.username});
     }
     io.to(sockets[req.user.username]).emit('new_friend',{'friend':id});
    });
     res.send('success');
   }
  });

  /* Function working fine */


  router.post('/getmsg',isAuthenticated,function(req,res){
		var a;
		var seen;
		var temp;
		var limit='FALSE';
    var id=req.body.id;
		chat[req.user.username]=id;
    var html='';
    var query=messages.find({username:req.user.username,seconduser:id}).select('message seen_now');
		var verify=messages.find({username:id,seconduser:req.user.username}).select('seen_now');
		verify.exec(function(err,result){
			if(result[0]!=undefined){
					a=result[0]['seen_now'];
			}
		});
    query.exec(function(err,msg){
      if(err){
        console.log(err);
      }
      else{
			if(msg[0]!=undefined){
			html=msg[0]['message'];
			seen=msg[0]['seen_now'];
		}
		if(html.length>20){
		html=html.splice(0,20);
		limit='TRUE';
		}
		console.log(html);
		res.send({'html':html,'seen':seen,'verify':a,'owner':req.user.username,'limit':limit});
  }

    });


  });

	router.get('/timeline',isAuthenticated,function(req,res){
		res.render('timeline');
	});

	/* Function working fine */

	var post_find=function(answers,callback){
		var timestamp=new Date();
		posts.find({_id:answers['post_id']}).exec(function(err,resp){
			var x={};
			resp=resp[0];
			x['haha_more']=0;
			x['love_more']=0;
			x['username']=answers['username'];
			x['type']=answers['type'];
			x['_id']=resp['_id'];
			timestamp=answers['timestamp'];
			x['timestamp']=answers['timestamp'];
			x['owner']=resp['username'];
			x['images']=resp['image'];
			x['status']=resp['status'];
			x['love']=resp['love'];
			x['haha']=resp['haha'];
			if(x['haha'].length>10){
				x['haha_more']=x['haha'].length-10;
				x['haha']=x['haha'].splice(0,10);
			}
			if(x['love'].length>10){
				X['love_more']=x['love'].length-10;
				x['love']=x['love'].splice(0,10);
			}
			callback(x,timestamp);

		});
	}

	/* Function working fine */

	router.post('/timeline',isAuthenticated,function(req,res){
		var q=friend.find({username:req.user.username});
		var timestamp=new Date();
		var onlineHtml = '';
		q.exec(function(err,result){
			if(result[0]!=undefined){
			var friends=result[0]['friends'];
			friends.forEach(function(value){
				if(sockets[value] != undefined){
					onlineHtml += '<h5 id="user_'+value+'">'+value+'</h5>';
					io.sockets.to(sockets[value]).emit('online',{'user':req.user.username});
				}
			});
			var query=activity.find({'username':{$in:friends},'timestamp':{$lt:timestamp}}).sort({'timestamp':1}).limit(10);
			var tempfunc=function(req,answers,callback,secondcallback,onlineHtml){
				var html=new Array;
				var timestamp=new Date();
				if(answers!=undefined){
					var j=0;
					for(var i=0;i<answers.length;i++){
						var value=answers[i];
						post_find(value,function(data,r_time){
							html.push(data);
							timestamp=r_time;
							j++;
						});
					}
					setTimeout(function(){
						callback(req,html,timestamp,secondcallback,onlineHtml);
					},1000);

			}
			};
			var fn2=function(req,html,timestamp,callback,onlineHtml){
				var msgs=new Array;
				var msgstamp=new Date();
				messages.find({username:req.user.username,'timestamp':{$lt:msgstamp}}).sort({'timestamp':1}).limit(5).exec(function(err,results){
					if(results!=undefined){
						console.log('yes');
						for(var i=0;i<results.length;i++){
							var x={};
							x['friend']=results[i]['seconduser'];
							x['seen']=results[i]['seen_now'];
							var msg=results[i]['message'];
							var l=msg.length;
							x['message']=msg[l-1].split(":")[1];
							x['timestamp']=results[i]['timestamp'];
							msgs[i]=x;
						}
					}
					else{
						console.log('problem');
					}
					callback(html,req,msgs,timestamp,onlineHtml);
				});
			};
			var fn3=function(html,req,msgs,timestamp,onlineHtml){
						var respond={};
						respond['timestamp']=timestamp;
						respond['html']=html;
						respond['user']=req.user.username;
						respond['messages']=msgs;
						respond['onlineHtml'] = onlineHtml;
						console.log(respond);
						res.send(respond);
			}
			query.exec(function(err,answers){
				tempfunc(req,answers,fn2,fn3,onlineHtml);
				});
			}
			});
	});

	/* Function working fine */


	router.post('/comment',isAuthenticated,function(req,response){
		console.log('received');
		var post_id=req.body.id;
		var comment=req.body.comment;
		console.log(comment);
		var comment_id;
		var friends;
		console.log(post_id);
		friend.find({username:req.user.username}).select('friends').exec(function(err,result){
			friends=result[0]['friends'];
			console.log(friends);
			posts.find({_id:post_id}).exec(function(err,res){
				console.log('res'+res[0]);
				if(res[0]!=undefined){

				if(friends.indexOf(res[0]['username'])==-1){
					console.log('fatal');
					response.end('error');
				}

				else{
					console.log('another');
					var x=new comments();
					x.post_id=post_id;
					x.description=comment;
					x.replies=new Array;
					x.username=res[0]['username'];
					x.name=req.user.username;
					x.save(function(err,id){
						comment_id=id['_id'];
						console.log('done');
					});
					var n=new activity();
					n.username=req.user.username;
					n.post_id=post_id;
					n.type=req.user.username+" commented on "+res[0]['username']+"'s post";
					n.save(function(err){

					});
					io.sockets.emit('newcomment',{'postid':post_id,'comment':comment,'user':req.user.username,comment_id:comment_id});
					friends.forEach(function(value){
						if(sockets[value]!=undefined){
							io.to(sockets[value]).emit('activity',{'act':req.user.username+" commnted on "+res[0]['username']+"'s Post",'_id':post_id});
						}
					});

					comments.find({post_id:post_id}).select('name').exec(function(err,ans){
						var key={};
						for(var i=0;i<ans.length;i++){
							var temp=ans[i]['name'];
							if(key[temp]==undefined){
								if(sockets[temp]!=undefined && temp!=res[0]['username'] && temp!=req.user.username){
									io.to(sockets[temp]).emit('newnotification',{id:post_id,noti:req.user.username+" also commnted on "+res[0]['username']+"'s Post",'_id':post_id});
								}
								if(res[0]['username']!=temp){
									key[temp] = true;
									var s=req.user.username+"also commnted on "+res[0]['username']+"'s Post";
									notifications.find({username:temp}).exec(function(err,r){
										if(r[0]==undefined){
											var x=new notifications();
											x.username=temp;
											var arr=new Array;
											arr.push(s);
											x.notifications=arr;
											x.save(function(err,cb){

											});
										}
										else {
											var noti=r[0]['notifications'];
											noti.push(s);
											notifications.update({username:temp},{notifications:noti},{multi:true},function(err){

											});
										}
									});
								}
							}
						}
					});
					var main=res[0]['username'];
				var s=req.user.username+" also commnted on your post";
				notifications.find({username:main}).exec(function(err,r){
					if(r[0]==undefined){
						var x=new notifications();
						x.username=main;
						var arr=new Array;
						arr.push(s);
						x.notifications=arr;
						x.save(function(err,cb){

						});
					}
					else {
						var noti=r[0]['notifications'];
						noti.push(s);
						notifications.update({username:main},{notifications:noti},{multi:true},function(err){
						});
					}
					if(sockets[main]!=undefined && main != req.user.username){
						io.to(sockets[main]).emit('newnotification',{id:post_id,user:req.user.username,noti:req.user.username+" commented on your post"});
					}
				});
				}
			}
			});
		});
	});

	/* Function working fine */


	router.post('/react',isAuthenticated,function(req,res){
			var love=req.body.love;
			var haha=req.body.haha;
			var react;
			if(love == true){
				react= 'love';
			}
			else{
				react = 'haha';
			}
			console.log(haha+love);
			console.log(react);
			var post_id=req.body.id;
			console.log(post_id);
			posts.find({_id:post_id}).exec(function(err,results){
				var lovelist=results[0]['love'];
				var hahalist=results[0]['haha'];
				if(lovelist.indexOf(req.user.username)==-1 && hahalist.indexOf(req.user.username)==-1){
					console.log('reached');
					if(love == true){
						lovelist.push(req.user.username);
						posts.update({_id:post_id},{love:lovelist},{multi:true},function(err){
						});
					}
					else{
						hahalist.push(req.user.username);
						posts.update({_id:post_id},{haha:hahalist},{multi:true},function(err){
						});
					}
					var n=new activity();
					n.username=req.user.username;
					n.post_id=post_id;
					n.type=req.user.username+" reacted "+react+" on "+results[0]['username']+"'s post";
					n.save(function(err){

					});
					io.sockets.emit('newreact',{'react':react,'post_id':post_id});
					friend.find({'username':req.user.username}).select('friends').exec(function(err,friends){
						friends = friends[0]['friends'];
						friends.forEach(function(value){
							if(sockets[value] != undefined){
								console.log('socket for new activity found');
								io.to(sockets[value]).emit('activity',{'act':req.user.username+" reacted "+react+" on "+results[0]['username']+"'s Post",'_id':post_id});
							}
						});
						if(sockets[results[0]['username']]!=undefined && results[0]['username'] != req.user.username){
							io.to(sockets[results[0]['username']]).emit('newnotification',{'id':post_id,'user':req.user.username,'noti':req.user.username+" reacted "+react+" on your post"});
						}
					
					});
					var s=req.user.username+" reacted "+react+" on your post";
					var main=results[0]['username'];
					notifications.find({username:main}).exec(function(err,r){
						if(r[0]==undefined){
							var x=new notifications();
							x.username=main;
							var arr=new Array;
							arr.push(s);
							x.notifications=arr;
							x.save(function(err,cb){

							});
						}
						else {
							var noti=r[0]['notifications'];
							noti.push(s);
							notifications.update({username:main},{notifications:noti},{multi:true},function(err){
							});
						}
					});
				}
				else{
					res.end('error');
				}
			});
	});

	/* Function working fine */

	router.post('/loadcomment',isAuthenticated,function(req,res){
		var commentstamp=req.body.commentstamp;
		console.log('I am'+commentstamp);
		var html=new Array;
		var post_id=req.body.post_id;
		var newstamp=new Date();
		comments.find({post_id:post_id,timestamp:{$lt:commentstamp}}).sort({'timestamp':-1}).limit(10).exec(function(err,result){

			result.forEach(function(value){
				var x={};
				newstamp=value['timestamp'];
				x['user']=value['name'];
				x['comment']=value['description'];
				x['comment_id']=value['_id'];
				html.push(x);
			});
			if(result[0] == undefined){
				console.log('undef');
				newstamp = null;
			}

		setTimeout(function(){
			console.log(html);
			var t={};
			t['comments']=html;
			t['timestamp']=newstamp;
			res.send(t);
		},50);
	});
	});

	router.post('/reply',isAuthenticated,function(req,response){
		var comment_id=req.body.id;
		var reply=req.body.reply;
		var friends;
		friend.find({username:req.user.username}).select('friends').exec(function(err,result){
			friends=result[0]['friends'];
			comments.find({_id:comment_id}).exec(function(err,res){
				if(friends.indexOf(res[0]['username'])==-1){
					response.end('error');
				}
				else{
					var replies=res[0]['replies'];
					replies.push(req.user.username+': '+reply);
					comments.update({_id:comment_id},{replies:replies},{multi:true},function(err){
						if(err){
							console.log(err);
							response.end('error');
						}
					});
					var n=new activity();
					n.username=req.user.username;
					n.post_id=res[0]['post_id'];
					n.type=req.user.username+" replied to a comment on "+res[0]['username']+"'s post";
					n.save(function(err){

					});
					io.sockets.emit('newreply',{'commentid':comment_id,'reply':reply,'user':req.user.username});
					friends.forEach(function(value){
						if(sockets[value]!=undefined){
							io.to(sockets[value]).emit('activity',{'act':req.user.username+"replied to a comment on "+res[0]['username']+"'s Post",'_id':res[0]['post_id']});
						}
					});
					var ans=res[0]['replies'];
					var post_id=res[0]['post_id'];
					var main=res[0]['username'];
					var passive=res[0]['name'];
					var key={};
					for(var i=0;i<ans.length;i++){
						var temp=ans[i].split(":")[0];
						if(key[temp]==undefined){
							if(sockets[temp] != undefined && temp != main && temp != passive){
								io.to(sockets[temp]).emit('newnotification',{id:post_id,user:req.user.username,noti:req.user.username+"also replied to a comment on "+main+"'s Post"});
							}
							if(main!=temp && temp!=passive){
								key[temp]=TRUE;
								var s=req.user.username+"also replied to a comment on "+main+"'s Post";
								notifications.find({username:temp}).exec(function(err,r){
									if(r[0]==undefined){
										var x=new notifications();
										x.username=temp;
										var arr=new Array;
										arr.push(s);
										x.notifications=arr;
										x.save(function(err,cb){

										});
									}
									else {
										var noti=r[0]['notifications'];
										noti.push(s);
										notifications.update({username:temp},{notifications:noti},{multi:true},function(err){

										});
									}

								});
							}
						}
					}
					var s=req.user.username+" replied to a comment on your post";
					notifications.find({username:main}).exec(function(err,r){
						if(r[0]==undefined){
							var x=new notifications();
							x.username=main;
							var arr=new Array;
							arr.push(s);
							x.notifications=arr;
							x.save(function(err,cb){

							});
						}
						else {
							var noti=r[0]['notifications'];
							noti.push(s);
							notifications.update({username:main},{notifications:noti},{multi:true},function(err){
							});
						}
							if(sockets[main]!=undefined && main != req.user.username){
								io.to(sockets[main]).emit('newnotification',{id:post_id,user:req.user.username,noti:req.user.username+"also replied to a comment on your status"});
							}
					});
						s=req.user.username+" replied to a your comment on "+main+"'s post";
						notifications.find({username:passive}).exec(function(err,r){
							if(r[0]==undefined){
								var x=new notifications();
								x.username=passive;
								var arr=new Array;
								arr.push(s);
								x.notifications=arr;
								x.save(function(err,cb){

								});
							}
							else {
								var noti=r[0]['notifications'];
								noti.push(s);
								notifications.update({username:passive},{notifications:noti},{multi:true},function(err){
								});
							}
							if(sockets[passive]!=undefined && passive != req.user.username){
								io.to(sockets[passive]).emit('newnotification',{id:post_id,user:req.user.username,noti:req.user.username+"also replied to your comment on "+main+"'s post"});
							}
					});
				}
			});
		});
	});

	/* Function working fine */

	router.post('/fillmsg',isAuthenticated,function(req,res){
			var msgstamp=req.body.msgstamp;
			console.log(msgstamp);
			var messagesArray = new Array;
			messages.find({username:req.body.username,timestamp:{$lt:msgstamp}}).sort({timestamp:1}).limit(5).exec(function(err,results){

			results.forEach(function(value){
				var x={};
				x['friend']=value['seconduser'];
				x['seen']=value['seen_now'];
				var msg=value['message'];
				var l = msg.length;
				x['message']=msg[l-1].split(":")[1];
				x['timestamp']=value['timestamp'];
				messagesArray.push(x);
			});
			if(results[0] == undefined){
				messagesArray = null;
			}
			setTimeout(function(){
				res.send(messagesArray);
			},100);

		});
	});


	router.post('/load',isAuthenticated,function(req,res){
		var mainstamp=req.body.mainstamp;
		var timestamp = null;
		var html=new Array;
		var q=friend.find({username:req.user.username});
		q.exec(function(err,result){
		var friends=result[0]['friends'];
		var query=activity.find({'username':{$in:friends},'timestamp':{$lt:mainstamp}}).sort({'timestamp':1}).limit(10);
		query.exec(function(err,answers){
			answers.forEach(function(value){
				post_find(value,function(data,time){
					timestamp=time;
					html.push(data);
				});
			});
			setTimeout(function(){
				res.send({timestamp:timestamp,html:html,user:req.user.username});
				console.log(timestamp);
			},100);

	});

});
});

	/* Function working fine */


	router.post('/updatestatus',isAuthenticated, makename, uploadnew.single('status_pic'), function(req,res){
		var statustext=req.body.status;
		console.log(JSON.stringify(req.body)+' avadeka dabra');
		x=new posts();
		x.username=req.user.username;
		x.image=imagename;
		x.status=statustext;
		x.love=new Array;
		x.haha=new Array;
		x.save(function(err,e){
			var post_id=e['_id'];
			var y = new activity();
			y.username = req.user.username;
			y.post_id = post_id;
			y.type=req.user.username+" updated their status!";
			y.save(function(err){
			});
			friend.find({username:req.user.username}).exec(function(err,results){
				var friends = [];
				if(results[0] != undefined){
					 friends=results[0]['friends'];
				}
				friends.forEach(function(value){
					if(sockets[value]!=undefined){
						io.to(sockets[value]).emit('activity',{'act':req.user.username+" updated their status!",'_id':post_id});
					}
				});
				res.redirect('/home');
			});
		});
	});


	router.post('/loadreply',isAuthenticated,function(req,res){
		var comment_id=req.body.id;
		comments.find({_id:comment_id}).select('replies').exec(function(err,result){
			res.send(result[0]['replies']);
		});
	});

	/* Function working fine */

	router.post('/search',isAuthenticated,function(req,res){
			var term=req.body.term;
			var html='';
			user.find({username:new RegExp("^"+term+"(.*)")}).select('username').limit(5).exec(function(err,results){
				if(results[0] == undefined){
					html = '<li> No results found </li>';
				}
				else{
					for(var i=0;i<results.length;i++){
						html+= '<li> <a href="#"> <p>'+results[i]['username']+'</p> </a> </li>';
					}
				}
				res.send(html);
			});
	});

	/* Function working fine */

	router.post('/viewpost',isAuthenticated,function(req,res){
		var id=req.body.post_id;
		console.log(req.body);
		res.end('Welcome'+id);
	});

	/* Function working fine */

  router.get('/signout',function(req,res){
    var agent=req.header('user-agent');
    var ip=req.ip;
    var string=ip+agent;
		delete authenticated[string];
		console.log(authenticated);
		req.logout();
    res.send('success');

  });

  return router;
}
