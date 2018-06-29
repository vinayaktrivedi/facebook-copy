$(document).ready(function(){
  var socket=io.connect('http://localhost:3000');
  var timestamp;
  var commentno={};
  var msgstamp;
  var msgcount=1;
  var arr=new Array;
  var noticount=1;
  var globalu;

  /* Function working fine */

  $.ajax({
    url:'http://127.0.0.1:3000/timeline',
    type:'POST',
    dataType:'text',
    cache:true,
    success:function(data){
      data=JSON.parse(data);
      var user=data['user'];
      var onlineHtml = data['onlineHtml'];
      globalu=user;
      timestamp=data['timestamp'];
        var msg=data['messages'];
      data=data['html'];
      console.log(msg);
      $("#onlinePeople").append(onlineHtml);
      for(var i=0;i<data.length;i++){
        var x=data[i];
        var string='';
        string+='<h3 style="color:#3B5999;margin-left:1%;margin-top:1%;">'+x['type']+'</h3><br><h5 style="margin-left:1%;">'+x['status']+'</h5><img src="./images/'+x['images']+'" class="img-responsive" style="width:90%;margin:auto;">';
        string+='<div class="panel-body"><div class="col-sm-3"><div style="float:left;"> <a href="#" style="float:right;" class="love_react" id="'+x['_id']+'_love">'+(x['love'].length).toString()+' Loves </a> </div><div class="love_list" id="'+x['_id']+'_love_list" style="float:right;">';
        for(var j=0;j<x['love'].length;j++){
          string+='<p>'+x['love'][j]+'</p>';
        }
        if(x['love_more']>0){
          string+='<p>'+x['love_more']+' More</p>';
        }
        string+='</div></div>';
        string+='<div class="panel-body"><div class="col-sm-3"><div style="float:left;"> <a href="#" style="float:right;" class="haha_react" id="'+x['_id']+'_haha">'+(x['haha'].length).toString()+' Haha </a> </div><div class="haha_list" id="'+x['_id']+'_haha_list" style="float:right;">';
        for(var j=0;j<x['haha'].length;j++){
          string+='<p>'+x['haha'][j]+'</p>';
        }
        if(x['haha_more']>0){
          string+='<p>'+x['haha_more']+' More</p>';
        }
        string+='</div></div></div><div class="panel-body"><div class="col-sm-1"><img src="./images/'+user+'.jpg" width="28px"></div><div class="col-sm-9"><form class="navbar-form navbar-left comment_form" id="'+x['_id']+'_commentform"><div class="input-group input-group-sm"><input class="form-control" placeholder="Comment" name="comment" id="'+x['_id']+'_comment" type="text">';
        string+='<div class="input-group-btn"><button class="btn btn-primary" type="submit">Comment</button></div></div></form></div></div>';
        string+='<div class="panel-body comment_list" id="'+x['_id']+'_commentlist"></div><div class="panel-body"><div class="col-sm-6"><a href="#">	<p class="loadcomments" id="'+x['_id']+'loadcomments"> Load More comments </p> </a></div></div></div>';
        commentno[x['_id']]=new Date();
          $("#mainarea").append(string);
      }
      console.log(commentno);
      if(msg.length<5){
        msgcount=0;
      }
      for(var i=0;i<msg.length;i++){
        var rawdata=msg[i];
        var string='';
        var seen='';
        if(rawdata['seen']=='FALSE'){
          seen='Not seen';
        }
        else if(rawdata['seen']!='TRUE'){
          seen='Seen ';
        }
        string+="<li class='msg_list' id='li_"+rawdata['friend']+"'><a href='#' class='msg_link' id='"+rawdata['friend']+"'><p style='width:320px;'><img src='./images/"+rawdata['friend']+".jpg' height='28px' width='28px'><span style='float:right;font-size:20px;'> "+rawdata['friend']+"</span> </p><p> <span style='float:left;' id='msg_"+rawdata['friend']+"'>";
        string+=rawdata['message']+"</span> <span style='float:right;' id='seen_"+rawdata['friend']+"'>"+seen+" </span> </p></a></li>";
          msgstamp=rawdata['timestamp'];
          arr.push(rawdata['timestamp']);
          $("#load_message").append(string);
      }
    },
    error: function (xhr, status, error) {
            console.log('Error: ' + error.message);
        }
  });

 /* Function working fine */

  $("#mainarea").on('click','.love_react',function(){
    var id=this.id;
    id=id.split("_love")[0];
    react('love',id);
  });

 /* Function working fine */

  $("#mainarea").on('click','.haha_react',function(){
    var id=this.id;
    id=id.split("_haha")[0];
    react('haha',id);
  });

 /* Function working fine */

  var react=function(type,post_id){
    console.log(type);
    var haha;
    var love;
    if(type=='love'){
      love = true;
      haha = false;
    }
    else if(type=='haha'){
      love = false;
      haha = true;
    }
    $.ajax({
      url:'http://127.0.0.1:3000/react',
      data:{'love':love,'haha':haha,'id':post_id},
      type:'POST',
      dataType:'text/html',
      cache:true,
      success:function(data){
        console.log(data);
      },
      error:function(){
        console.log('error');
      }
    });
  }

  /* Function working fine */

  socket.on('activity',function(data){
      $("#activity_list").prepend('<h5 class="rightbar" id="'+data['_id']+'_activity">'+data['act']+'</h5>');
  });


  socket.on('online',function(data){
    $("#onlinePeople").prepend('<h5 id="user_'+data['user']+'">'+data['user']+'</h5>');
  });


  socket.on('offline',function(data){
    console.log('hello');
    $("#user_"+data['user']).remove();
  });
 /* Function working fine */


  $("#activity_list").on('click','.rightbar',function(){
    var id=this.id;
    id=id.split("_activity")[0];
      $.ajax({
      url:'http://127.0.0.1:3000/viewpost',
      data:{'post_id':id},
      type:'POST',
      dataType:'text',
      cache:true,
      success:function(data){
        $("html").html(data);
      },
      error:function(){
        console.log('error');
      }
    });
  });

  /*setInterval(function(){
    $("#hidden").hide();
  }, 5000); */

/* Function working fine */

  $("#search_form #srch-term").bind('input',function(){
    var term=$("#srch-term").val();
    if(term!='')
      search(term);
    else{
      document.getElementById('search_results').innerHTML='';
    }
  });

  /* Function working fine */

var search=function(data){
    $.ajax({
      url:'http://127.0.0.1:3000/search',
      data:{'term':data},
      type:'POST',
      dataType:'text',
      cache:true,
      success:function(data){
        document.getElementById('search_results').innerHTML=data;
        $("#hidden").show();
      },
      error:function(){
        console.log('error');
      }
    });
  }

/* Function working fine */

  $("#search_form").submit(function(e){
     e.preventDefault();
     var term=$("#srch-term").val();
     $("#srch-term").val('');
     search(term);
  });


  socket.on('seen',function(data){
    data=JSON.parse(data);
    var seen=data['time'];
    var user=data['second'];
    $("#load_message").find('#seen_'+user).html('Seen '+seen);
  });


  socket.on('newmsg',function(data){
    var v=$("#top_message").text();
    if(v==''){
      v=1;
    }
    else{
    v=parseInt(v);
    v=v+1;
  }
    $("#top_message").html(v.toString());
    var msg=data['data'];
    msg=msg.split(":");
    var string;
    string+="<li class='msg_list' id='li_"+data['second']+"'><a href='#' class='msg_link' id='"+data['second']+"'><p style='width:320px;'><img src='./images/"+data['second']+".jpg' height='28px' width='28px'><span style='float:right;font-size:20px;'> "+data['second']+"</span> </p><p> <span style='float:left;' id='msg_"+data['second']+"'>";
    string+=msg[1]+"</span> <span style='float:right;' id='seen_"+data['second']+"'> </span> </p></a></li>";
    if($("#load_message").find("#li_"+data['second']).length!=0){
      $("#load_message").find("#li_"+data['second']).remove();
      $("#load_message").prepend(string);
    }
    else{
      if(msgcount==1){
        $("#load_message").children().last().remove();
        arr.splice(-1,1);
        arr.unshift(new Date());
        msgstamp=arr[arr.length-1];
      }
      $("#load_message").prepend(string);
    }
  });

  /* Function working fine */

  $("#mainarea").on('submit','.comment_form',function(){
    console.log('registered');
    var id=this.id;
    var postid=id.split("_commentform");
    postid=postid[0];
    var comment=$("#mainarea").find('#'+postid+'_comment').text();
    console.log(comment);
    $.ajax({
      url:'http://127.0.0.1:3000/comment',
      data:{'id':postid,'comment':comment},
      type:'POST',
      dataType:'text/html',
      cache:true,
      success:function(data){
        console.log('success');
      },
      error:function(){
        console.log('error');

      }
    });
  });


  socket.on('newreply',function(data){
    data=JSON.parse(data);
    var string='';
    string+='<div class="col-sm-12"><div class="col-sm-1"><img src="./images/'+data['user']+'" height="28px" width="28px"></div><div class="col-sm-11"><p class="form-control">'+data['reply']+' </p></div></div>';
    $("#mainarea").find("#"+data['commentid']+'_mainreplydiv').append(string);
  });


  socket.on('newcomment',function(data){
    data=JSON.parse(data);
    var string='';
    string+='<div class="col-sm-1"><img src="./images/'+data['user']+'" height="28px" width="28px"></div><div class="col-sm-11"><p class="form-control">'+data['comment']+'</p><div class="col-sm-12"><button class="loadreplylist btn btn-primary" id="'+data['comment_id']+'" type="button">View Replies </button></div><div><div class="col-sm-12"><div class="col-sm-1"><img src="./images/'+globalu+'" height="28px" width="28px"></div><div class="col-sm-11"><form class="reply_form" id="'+data['comment_id']+'_replyform"><input type="text" name="reply" id="'+data['comment_id']+'_reply" class="form-control" placeholder="Reply"><button class="btn btn-primary pull-right" type="submit">Reply</button></form></div></div></div><div class="reply_list" id="'+data['comment_id']+'_mainreplydiv"></div>';
      $("#mainarea").find("#"+data['postid']+'_commentlist').prepend(string);
  });

 /* Function working fine */


  socket.on('newnotification',function(data){
    console.log(data);
    var v=$("#top_notification").text();
    if(v==''){
      v=1;
    }
    else{
    v=parseInt(v);
    v=v+1;
    }
    $("#top_notification").html(v.toString());
    $("#load_notifications").prepend('<li class="notification_list" id="'+data['id']+'_post"><a href="#"><p style="width:320px;"><img src="./images/'+data['user']+'" height="28px" width="28px"><span>'+data['noti']+' </span> </p></a></li>');
  });


  $("#load_notifications").on('click','.notification_list',function(){
    var id=this.id;
    id=id.split("_post")[0];
    window.location.href='/viewpost?post_id='+id;
  });


   /* Function working fine */

  socket.on('newreact',function(data){
    var post_id=data['post_id'];
    if(data['react'] == 'love'){
      var x=$("#mainarea").find("#"+post_id+'_love').text();
      x=x.split(" ");
      x=parseInt(x[0]);
      x=x+1;
      $("#mainarea").find("#"+post_id+'_love').html(x.toString() + " Love");
    }
    else if(data['react'] == 'haha'){
      var x=$("#mainarea").find("#"+post_id+'_haha').text();
      x=x.split(" ");
      x=parseInt(x[0]);
      x=x+1;
      $("#mainarea").find("#"+post_id+'_haha').html(x.toString()+" Haha");
    }
  });

  /* Function working fine */

  $("#mainarea").on('click','.loadcomments',function(){
    var id=this.id;
    id=id.split("loadcomments")[0];
    $.ajax({
      url:'http://127.0.0.1:3000/loadcomment',
      data:{'commentstamp':commentno[id],'post_id':id},
      type:'POST',
      dataType:'text',
      cache:true,
      success:function(data){
        console.log('success');
        data=JSON.parse(data);
        if(data['timestamp'] != null){
          console.log("changed");
          commentno[id]=data['timestamp'];
        }
        var string='';
        data=data['comments'];
        console.log(data);
        for(var i=0;i<data.length;i++){
          var temp=data[i];
          string+='<div class="col-sm-1"><img src="./images/'+temp['user']+'.jpg" height="28px" width="28px"></div><div class="col-sm-11"><p class="form-control">'+temp['comment']+'</p><div class="col-sm-12"><button class="loadreplylist btn btn-primary" id="'+temp['comment_id']+'" type="button">View Replies </button></div><div><div class="col-sm-12"><div class="col-sm-1"><img src="./images/'+globalu+'.jpg" height="28px" width="28px"></div><div class="col-sm-11"><form class="reply_form" id="'+temp['comment_id']+'_replyform"><input type="text" name="reply" id="'+temp['comment_id']+'_reply" class="form-control" placeholder="Reply"><button class="btn btn-primary pull-right" type="submit">Reply</button></form></div></div></div><div class="reply_list" id="'+temp['comment_id']+'_mainreplydiv"></div></div>';
        }
        var appendid = "#"+id+"_commentlist";
        $("#mainarea").find(appendid).append(string);

      },
      error:function (xhr, status, error) {
              console.log('Error: ' + error.message);
          }
    });

  });


$("#mainarea").on('click','.loadreplylist',function(){
  var comment_id=this.id;
  $.ajax({
    url:'http://127.0.0.1:3000/loadreply',
    data:{'id':comment_id},
    type:'POST',
    dataType:'text/html',
    cache:true,
    success:function(data){
      for(var i=0;i<data.length;i++){
        var temp=data[i];
        temp=temp.split(":");
        var user=temp[0];
        var string='';
        string+='<div class="col-sm-12"><div class="col-sm-1"><img src="./images/'+user+'" height="28px" width="28px"></div><div class="col-sm-11"><p class="form-control">'+temp[1]+' </p></div></div>';
        $("#mainarea").find("#"+comment_id+'_mainreplydiv').html(string);
      }
    },
    error:function(){
      console.log('error');
    }
  });
});

  /* Function working fine */

$("#load_more_stories").on('click',function(data){
  console.log(timestamp);
  $.ajax({
    url:'http://127.0.0.1:3000/load',
    type:'POST',
    data:{'mainstamp':timestamp},
    dataType:'text',
    cache:true,
    success:function(data) {
      data=JSON.parse(data);
      var user=data['user'];
      if(data['timestamp'] != null){
        timestamp=data['timestamp'];
      }
      data=data['html'];
      for(var i=0;i<data.length;i++){
        var x=data[i];
        var string='';
        string+='<h3 style="color:#3B5999;margin-left:1%;margin-top:1%;">'+x['type']+'</h3><br><h5 style="margin-left:1%;">'+x['status']+'</h5><img src="./images/'+x['images']+'" class="img-responsive" style="width:90%;margin:auto;">';
        string+='<div class="panel-body"><div class="col-sm-3"><div style="float:left;"> <a href="#" style="float:right;" class="love_react" id="'+x['_id']+'_love">'+(x['love'].length).toString()+'Loves </a> </div><div class="love_list" id="'+x['_id']+'_love_list" style="float:right;">';
        for(var j=0;j<x['love'].length;j++){
          string+='<p>'+x['love'][j]+'</p>';
        }
        if(x['love_more']>0){
          string+='<p>'+x['love_more']+' More</p>';
        }
        string+='</div></div>';
        string+='<div class="panel-body"><div class="col-sm-3"><div style="float:left;"> <a href="#" style="float:right;" class="haha_react" id="'+x['_id']+'_haha">'+(x['haha'].length).toString()+'Haha </a> </div><div class="haha_list" id="'+x['_id']+'_haha_list" style="float:right;">';
        for(var j=0;j<x['haha'].length;j++){
          string+='<p>'+x['haha'][j]+'</p>';
        }
        if(x['haha_more']>0){
          string+='<p>'+x['haha_more']+' More</p>';
        }
        string+='</div></div></div><div class="panel-body"><div class="col-sm-1"><img src="./images/'+user+'.jpg" width="28px"></div><div class="col-sm-9"><form class="navbar-form navbar-left comment_form" id="'+x['_id']+'_commentform"><div class="input-group input-group-sm"><input class="form-control" placeholder="Comment" name="comment" id="'+x['_id']+'_comment" type="text">';
        string+='<div class="input-group-btn"><button class="btn btn-primary" type="submit">Comment</button></div></div></form></div></div>';
        string+='<div class="panel-body comment_list" id="'+x['_id']+'_commentlist"></div><div class="panel-body"><div class="col-sm-6"><a href="#">	<p class="loadcomments" id="'+x['_id']+'loadcomments"> Load More comments </p> </a></div></div></div>';
        commentno[x['_id']]=new Date();
      }
      $("#mainarea").append(string);
    },
    error:function(){
      console.log('error');
    }
  });
});

/* Function working fine */


$("#load_more_messages").on('click',function(){
  console.log(msgstamp);
  $.ajax({
    url:'http://127.0.0.1:3000/fillmsg',
    data:{'msgstamp':msgstamp},
    type:'POST',
    dataType:'text',
    cache:true,
    success:function(data){
      if(data != null){
        var msg=data;
        for(var i=0;i<msg.length;i++){
          console.log('yes');
          var rawdata=msg[i];
          var string='';
          var seen='';
          if(rawdata['seen']=='FALSE'){
            seen='Not seen';
          }
          else if(rawdata['seen']!='TRUE'){
            seen='Seen ';
          }
          string+="<li class='msg_list' id='li_"+rawdata['friend']+"'><a href='#' class='msg_link' id='"+rawdata['friend']+"'><p style='width:320px;'><img src='./images/"+rawdata['friend']+"'.jpg' height='28px' width='28px'><span style='float:right;font-size:20px;'> "+rawdata['friend']+"</span> </p><p> <span style='float:left;' id='msg_"+rawdata['friend']+"'>";
          string+=rawdata['message']+"</span> <span style='float:right;' id='seen_"+rawdata['friend']+"'>"+seen+" </span> </p></a></li>";
            msgstamp=rawdata['timestamp'];
            arr.push(rawdata['timestamp']);
            $("#load_message").append(string);
        }
    }

    },
    error:function(){
      console.log('error');
    }
  });
});


  $("#mainarea").on('submit','.reply_form',function(){
    var id=this.id;
    var comment_id=id.split("_replyform")[0];
    var reply=$("#mainarea").find("#"+comment_id+'_reply').text();
    $.ajax({
      url:'http://127.0.0.1:3000/reply',
      data:{'id':comment_id,'reply':reply},
      type:'POST',
      dataType:'text/html',
      cache:true,
      success:function(data){
        console.log('success');
      },
      error:function(){
        console.log('error');
      }
    })
  });
});
