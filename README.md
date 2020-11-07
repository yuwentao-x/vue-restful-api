## vue-restful-api

### 一 原型项目
node-mongodb-express

### 二 改造需求
> 允许跨域
```js
npm i cors
const cors = require('cors');
app.use(cors())
```

> token鉴权(去除session鉴权)
```js
npm i jsonwebtoken

const jwt = require('jsonwebtoken');

// 用户登录拦截
app.all("*",function(req,res,next){
   // 鉴权验证中间件
   if(req.path!="/getToken"){
     var token = req.headers.token;
     jwt.verify(token,'shhhhhh',function(err,decoded){
        if(decoded&&decoded.foo){
          next()
        }else{
          res.json({error:1,msg:"请求不合法"})
        }
     })
   }else{
     next()
   }
})

app.get('/getToken',function(req,res){
    var token = jwt.sign({foo:"bar"},'shhhhhh');
    res.json({
      token
    })
})
```

> 去除静态资源
+ 删除public文件夹
+ 删除静态资源配置
+ 删除favicon.ico配置

> 有取舍的删除views里面的内容
+ 模板配置不能删除,要保留views里面的error.ejs,同时要保留res.render方法

> 接口路由说明(去除所有重定向和服务器渲染)

路由|功能|请求方式|入参|返回值|说明
:-|:-|:-|:-|:-|:-
/getToken|获取token|get|无|{token:""}|无
/list|返回指定页面文章数据|get|page,size|{error:0,data:{currentPage:"",totalPage:"",list:[]}}|无
/detail|返回指定文章详情|get|id|{error:0,data:{}}|无
/users/regist|注册接口|post|username,password|{error:0,data:{username:""}}|无
/users/login|登陆接口|post|username,password|{error:0,data:{username:""}}|无
/articles/write|文章修改和新增接口|post|title,content,username,id|{error:0,data:{}}|有id是修改接口,无id是新增接口
/articles/delete|文章删除接口|get|id|{error:0}|无


> 修改index.js:
```js
const express = require('express');
const articleModel = require('../db/articleModel');
const moment = require('moment');//时间格式化
let router = express.Router();

// 指定页文章列表
router.get('/list',(req,res,next)=>{
    let page = parseInt(req.query.page||1);//如果page没有传,默认是第一页
    let size = parseInt(req.query.size||3);//如果size没有传,默认一页显示3条文章
    let username = req.session.username;
    // 第一步:查询文章总数,并计算总页数
    articleModel.find().count().then(total=>{
        // total就是文章的总条数
        // 获取总页数
        var pages = Math.ceil(total/size);
        // 第二步:分页查询
        articleModel.find().sort({'createTime':-1}).skip((page-1)*size).limit(size)
        .then(docs=>{
            // docs不是传统意义的js数组,要使用slice()方法把他转化成js数组
            var arr = docs.slice();
            for(let i=0;i<arr.length;i++){
                // 原有的文档的字段值,不能修改吗?
                // 添加一个新的字段,来表示格式化的时间
                arr[i].createTimeZH = moment(arr[i].createTime).format('YYYY-MM-DD HH:mm:ss')
            };
            res.json({
                error:0,
                data:{
                    currentPage:page,
                    totalPage:pages,
                    list:arr
                }
            })
        })
        .catch(err=>{
            res.json({
                error:1
            })
        })
    })
    
})

// 详情页路由
router.get('/detail',(req,res,next)=>{
    var id = req.query.id;
    // 用id查询
    articleModel.findById(id)
    .then(doc=>{
        doc.createTimeZH = moment(doc.createTime).format('YYYY-MM-DD HH:mm:ss');
        res.json({
            error:0,
            data:doc
        })
    })
    .catch(err=>{
        res.json({
            error:1
        })
    })
    
})

module.exports = router;
```

> 修改articles.js:
```js
const express = require('express');
const { findById } = require('../db/articleModel');
const fs = require('fs')
const path = require('path')
let router = express.Router();
var multiparty = require('multiparty');//处理文件上传
let articleModel = require('../db/articleModel');

router.post('/write',(req,res,next)=>{
    // 接收post数据
    let {title,content,username,id} = req.body;
    // 当前时间
    let createTime = Date.now()
    if(id){
        // 修改文章
        id = new Object(id);
        articleModel.updateOne({_id:id},{
            title,content,createTime,username
        }).then(data=>{
            res.json({
                error:0,
                data
            })
        }).catch(err=>{
            res.json({
                error:1
            })
        })
    }else{
        // 新增文章
        // 插入数据库
        articleModel.insertMany({
            username,
            title,
            content,
            createTime
        }).then(data=>{
            res.json({
                error:0,
                data
            })
        }).catch(err=>{
            res.json({
                error:1
            })
        })
    }
})


router.get('/delete',(req,res,next)=>{
    let id = req.query.id;
    id = new Object(id);
    // 删除
    articleModel.deleteOne({_id:id})
    .then(data=>{
        res.json({
            error:0
        })
    })
    .catch(err=>{
        res.json({
            error:1
        })
    })
})


module.exports = router;
```

> 修改users.js:
```js
const express = require('express');
const bcrypt = require('bcrypt')
let router = express.Router();
let userModel = require('../db/userModel');

router.post('/regist',(req,res,next)=>{
    // 接收post数据
    let {username,password,password2} = req.body; // 解构赋值
    // 密码不直接存入数据,先加密,再存入数据库
    password = bcrypt.hashSync(password, 10);
    // 数据校验工作,在这里完成
    // 查询是否存在这个用户
    userModel.find({username}).then(docs=>{
        if(docs.length>0){
            // res.send('用户已存在')
            res.redirect('/regist')
        }else{
            // 用户不存在,开始注册
            let createTime = Date.now();
            // 插入数据
            userModel.insertMany({
                username,
                password,
                createTime
            }).then(docs=>{
                res.json({
                    error:0,
                    data:{
                        username
                    }
                })
            }).catch(err=>{
                res.json({
                    error:1
                })
            })
        }
    })
})


router.post('/login',(req,res,next)=>{
    // 接收post数据
    let {username,password} = req.body;
    // 操作数据库
    userModel.find({username})
    .then(docs=>{
        if(docs.length>0){
            // 说明有这个用户
            // 检验数据库里面的密文是否由你输入的明文密码产生
            var result = bcrypt.compareSync(password, docs[0].password)
            if(result){
                res.json({
                    error:0,
                    data:{
                        username
                    }
                }) 
            }else{
                res.json({
                    error:1
                })
            }
              
        }else{
            res.json({
                error:1
            })
        }
    })
    .catch(function(){
        res.json({
            error:1
        })
    })
})

module.exports = router;

```





