var express = require('express');
const articleModel = require('../db/articleModel');
const moment = require('moment');// 时间格式化
var router = express.Router();

// 指定页文章列表
router.get('/list', function (req, res, next) {
  console.log(req.query);
  // 数据类型是Number
  let page = parseInt(req.query.page || 1);// 如果page没有传,默认是第一页
  let size = parseInt(req.query.size || 3);// 如果size没有传,默认一页显示3条文章
  let username = req.session.username;
  // 第一步:查询文章总数,并计算总页数
  articleModel.find().count().then(total => {
    // total就是文章的总条数
    // 获取总页数
    var pages = Math.ceil(total / size);
    // 第二步:分页查询
    articleModel.find().sort({ 'createTime': -1 }).skip((page - 1) * size).limit(size)
      .then(docs => {
        // docs不是传统意义的js数组,要使用slice()方法把它转化成js数组
        var arr = docs.slice();
        for (let i = 0; i < arr.length; i++) {
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
        });

      })
      .catch(err => {
        res.json({
          error:1
        })
      })
  })
});



// 详情页路由
router.get('/detail', (req, res, next) => {
  var id = req.query.id;
  // 用id查询
  articleModel.findById(id)
    .then(doc => {
      doc.createTimeZH = moment(doc.createTime).format('YYYY-MM-DD HH:mm:ss');
      res.json({
        error:0,
        data:doc
      })
    }).catch(err => {
      res.json({
        error:1
      })
    })
})

module.exports = router;
