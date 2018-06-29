var http=require('http');
var express=require('express');
var path = require('path');
var session=require('express-session');
var passport=require('passport');
var cookieparser=require('cookie-parser');
var app=express();
var MemoryStore=session.MemoryStore;
var http=require('http').Server(app);
var fs = require('fs');
var favicon = require('static-favicon');
app.use(favicon());
var messages=require('./models/messages');
var flash=require('connect-flash');
app.use(flash());
var mongoose=require('mongoose');
var io=require('socket.io').listen(http);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
mongoose.connect('mongodb://localhost/messapp');
var bodyParser=require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ keepExtensions: true, extended: false  }));
app.use(cookieparser());
var storep=new MemoryStore();
app.use(session({
  secret: 'InterIITTechMeet17',
  store:storep,

  cookie:{
    key:'connect.sid',
    maxAge: 1000 * 24 * 60
  }
}));
app.use(express.static(__dirname + '/views'));
app.use(passport.initialize());
app.use(passport.session());
var routes = require('./routes/index')(passport,io);
app.use('/', routes);
var initpassport=require('./passport/init');
initpassport(passport);
http.listen(3000);
