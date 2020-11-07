var createError = require('http-errors'); //处理http错误的模块
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser'); // 处理cookie的模块
var logger = require('morgan'); // 打印日志的模块 
var session = require('express-session');// session是服务端存储用户信息的模块
const cors = require('cors');
const jwt = require('jsonwebtoken')

var indexRouter = require('./routes/index');//导入模板子路由
var usersRouter = require('./routes/users');//导入用户子路由
var articlesRouter = require('./routes/articles');

// 连接数据库
var db = require('./db/connect');
// favicon
var favicon = require('serve-favicon');

var app = express();
app.use(cors());


// 配置ejs模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
// 使用body-parse中间件,就可以使用req.body解析请求主体
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 使用cookie-parse中间件,就可以解析cookie
app.use(cookieParser());



// 登录拦截
// app.all('*',function(req,res,next){
//   // 鉴权验证中间件
//   if(req.path!="getToken"){
//     var token = req.headers.token;
//     jwt.verify(token,'shhhhhh',function(err,decoded){
//       if(decoded&&decoded.foo){
//         next()
//       }else{
//         res.json({error:1,msg:"请求不合法"})
//       }
//     })
//   }else{
//     next()
//   }
// })

app.post('/getToken',function(req,res){
  var token = jwt.sign({foo:"bar"},'shhhhhh');
  res.json({
    token
  })
})

// 配置子路由
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/articles', articlesRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
