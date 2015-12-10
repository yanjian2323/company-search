var express = require('express');
var http =  require('http');
var io = require('socket.io');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('ejs-locals');
var log4js = require('log4js');
var _ = require('lodash');
var log4js_logger = require('./logger');
var search = require('./lib/search');

var routes = require('./routes/index');
var users = require('./routes/users');
var search_route = require('./routes/search');

var app = express();


// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//log
_.forEach(log4js_logger, function(log){
  app.use(log4js.connectLogger(log, {level:log4js.levels.INFO}));
});

app.use('/', routes);
app.use('/search', search_route);
app.use('/users', users);

var server = http.createServer(app);
var socket = io(server);

socket.on('connection', function(client){ 
console.log('====================');
  // 成功！现在开始监听接收到的消息
  client.on('message',function(data){
    // console.log('Received message from client!',event); 
    search.get_data(data, client, function(err, page_info){
      client.send('completed');
    });
  }); 
  client.on('disconnect',function(){ 
    console.log('Server has disconnected'); 
  });


  // setInterval(function(){
  //   client.send({name:"yanjian"});
  // }, 1000);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

server.listen(3000);


module.exports = app;
