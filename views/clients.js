$(document).ready(function(){
  var socket=io.connect('http://localhost:3000');
  var friend;
  var seen='';
  var index;
  var not_seen=new Array();
  var windows=$(window);
  var title=$("title");
  var flag=1;
  $.ajax({
    url:'http://127.0.0.1:3000/fill',
    type:'POST',
    dataType:'text',
    cache:true,
    success:function(data){
        data=JSON.parse(data);
        var friends='<h6>Friends</h6>';
        var users='<h6>All users</h6>';
        var temp=data['friends'][0];
        if(temp!=undefined){
          temp=temp['friends'];
          for(var i=0;i<temp.length;i++){
            friends+="<div class='friend' id="+temp[i]+"> <div class='user'> <div class='avatar'><img src='./images/"+temp[i]+".jpg' alt='./images/user.jpg'> <div class='status off'></div> </div><div class='name' >"+temp[i]+"</div></div></div>";
          }
        }
        for(var i=0;i<data['users'].length;i++){
          users+="<div class='tobefriends' id="+data['users'][i]['username']+"> <div class='user'>  <div class='avatar'><img src='./images/"+data['users'][i]['username']+".jpg' alt='./images/user.jpg'> <div class='status off'></div> </div><div class='name'>"+data['users'][i]['username']+"</div></div></div>";
        }
        document.getElementById('friends_list').innerHTML=friends;
        document.getElementById('users_list').innerHTML=users;

    },
    error: function (xhr, status, error) {
        console.log('Error: ' + error.message);

    }
  })
  $("body").on('click','.friend',function(){
    var id = this.id;
    friend=id;
    index=10;
    $.ajax({
        url: 'http://127.0.0.1:3000/getmsg',
        // dataType: "jsonp",
        data: {'id':id},
        type: 'POST',
        dataType: 'html',
        cache: true,
        success: function (data) {
          data=JSON.parse(data);
          var temp='<h6 id="fixed">'+friend+'</h6> ';
          for(var i=0;i<data['html'].length;i++){
            var x=data['html'][i];
            x=x.split(":");
            if(x[0]=="You "){
              temp+="<div class='answer right'> <div class='avatar'><img class='image' src='./images/"+data['owner']+".jpg' alt='./images/user.jpg'> <div class='status online'></div></div> <div class='name'>You</div><div class='text'>"+x[1]+"</div> </div>";
            }
            else{
                temp+="<div class='answer left'> <div class='avatar'><img class='image' src='./images/"+friend+".jpg' alt='./images/user.jpg'> <div class='status online'></div></div> <div class='name'>"+friend+"</div><div class='text'>"+x[1]+"</div> </div>";
            }
          }
            document.getElementById('msgs_coming').innerHTML=temp;
            if(!(data['seen']=='FALSE' || data['seen']=='TRUE')){
              if(data['seen']!=undefined){

              document.getElementById('seen').innerHTML='Seen at '+data['seen'];
              seen='Seen at'+data['seen'];
            }
            console.log(data['seen']);
            }
            if(data['verify']=='FALSE'){
              socket.emit('seen',{'friend':friend});
            }
            $("#msg_form").show();
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);

        }
    });
  });
  $("body").on('click','.tobefriends',function(){
    console.log('hello');
    var id = this.id;
    $.ajax({
        url: 'http://127.0.0.1:3000/friend',
        // dataType: "jsonp",
        data: {'id':id},
        type: 'POST',
        dataType: 'text/html',
        cache: true,
        success: function (data) {
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);

        }
    });
  });
  socket.on('new_friend',function(data){
    var frnd=data['friend'];
    var string="<div class='friend' id="+frnd+"><div class='user'>  <div class='avatar'><img src='./images/"+frnd+".jpg' alt='./images/user.jpg'> <div class='status off'></div> </div><div class='name'>"+frnd+"</div></div></div>";
    $("#friends_list").append(string);
  });
  socket.on('seen',function(data){
    if(friend==data['second']){
      seen='Seen at '+data['time'];
      document.getElementById('seen').innerHTML='Seen at '+data['time'];
    }
  });
  setInterval(function(){
      var i=0;
      for(var i=0;i<not_seen.length;i++){

          if(friend==not_seen[i] && flag==0){
            console.log(not_seen[i]);
            socket.emit('seen',{'friend':not_seen[i]});
            not_seen.splice(i,1);
          }
        }


  }, 500);
  windows.focus(function(){
    title.text("VAAD SAMVAAD");
    flag=0;
  });
  windows.blur(function(){
    flag=1;
  });
  socket.on('newmsg',function(data){
    var x=data['data'].split(":");
    document.getElementById('seen').innerHTML='';

    if(x[0]=='You '){
        $("#msgs_coming").append("<div class='answer right'> <div class='avatar'><img class='image' src='./images/"+data['second']+".jpg' alt='./images/user.jpg'> <div class='status online'></div></div> <div class='name'>You</div><div class='text'>"+x[1]+"</div> </div>");
    }
    else{
      if(flag==1){
      title.text(data['second']+" messaged you!");

    }
    if(flag==1||friend!=data['second']){
      if($.inArray(data['second'], not_seen)==-1){
      not_seen.push(data['second']);
    }
    console.log(not_seen);
    }
    else if(friend==data['second']){
      socket.emit('seen',{'friend':friend});
    }
      if(friend==data['second']){
      $("#msgs_coming").append("<div class='answer left'> <div class='avatar'><img class='image' src='./images/"+data['second']+".jpg' alt='./images/user.jpg'> <div class='status online'></div></div> <div class='name'>"+data['second']+"</div><div class='text'>"+x[1]+"</div> </div>");
    }
    }

  });
  socket.on('typing',function(data){
    if(friend==data['friend']){
    initial=document.getElementById('seen').value;
    document.getElementById('seen').innerHTML=friend+' is typing!!';
    }
  });
  $("#msg").blur(function(){
    socket.emit('blur',{friend:friend});
  });
  socket.on('blur',function(data){
    if(friend==data['friend']){
    document.getElementById('seen').innerHTML='';
    }
  });
  $("#msg_form #msg").bind('input',function(){
    console.log('love');
    socket.emit('typing',{friend:friend});

  });
  $("#signout").on('click',function(){
    $.ajax({
      url:'http://127.0.0.1:3000/signout',
      data: {},
      type: 'GET',
      dataType: 'text/html',
      cache: true,
      success: function (data) {
      },
      error: function (xhr, status, error) {
          console.log('Error: ' + error.message);

      }
    });
     window.location.href='/';
  });
  socket.on('initial',function(data){
    console.log(data['friend']);
    friend=data['friend'];
    $.ajax({
        url: 'http://127.0.0.1:3000/getmsg',
        // dataType: "jsonp",
        data: {'id':data['friend']},
        type: 'POST',
        dataType: 'html',
        cache: true,
        success: function (data) {
          data=JSON.parse(data);
          var temp='<h6 id="fixed">'+friend+'</h6> ';
          for(var i=0;i<data['html'].length;i++){
            var x=data['html'][i];
            x=x.split(":");
            if(x[0]=="You "){
              temp+="<div class='answer right'> <div class='avatar'><img class='image' src='./images/"+data['owner']+".jpg' alt='./images/user.jpg'> <div class='status online'></div></div> <div class='name'>You</div><div class='text'>"+x[1]+"</div> </div>";
            }
            else{
                temp+="<div class='answer left'> <div class='avatar'><img class='image' src='./images/"+friend+".jpg' alt='./images/user.jpg'> <div class='status online'></div></div> <div class='name'>"+friend+"</div><div class='text'>"+x[1]+"</div> </div>";
            }
          }
            document.getElementById('msgs_coming').innerHTML=temp;
            if(!(data['seen']=='FALSE' || data['seen']=='TRUE')){
              if(data['seen']!=undefined){

              document.getElementById('seen').innerHTML='Seen at '+data['seen'];
              seen='Seen at'+data['seen'];
            }
            console.log(data['seen']);
            }
            if(data['verify']=='FALSE'){
              socket.emit('seen',{'friend':friend});
            }
            $("#msg_form").show();
        },
        error: function (xhr, status, error) {
            console.log('Error: ' + error.message);

        }
    });
  });
  $("#msg_form").submit(function(e){
     e.preventDefault();
     var msg=$("#msg").val();
     $("#msg").val('');
     document.getElementById('seen').innerHTML='';
     $.ajax({
       url:'http://127.0.0.1:3000/sendmsg',
       data:{'id':friend,'msg':msg},
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
  });

});
