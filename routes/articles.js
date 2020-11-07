var express = require('express');
const fs = require('fs');
const path = require('path');
let router = express.Router();
var multiparty = require('multiparty'); // 处理文件上传
let articleModel = require('../db//articleModel');

router.post('/write', (req, res, next) => {
    // 接收post数据
    let { title, content, username, id } = req.body;
    // 当前时间
    let createTime = Date.now()
    if (id) {
        // 修改文章
        id = new Object(id);
        articleModel.updateOne({ _id: id }, {
            title, content, createTime, username
        }).then(data => {
            res.json({
                error:0,
                data
            })
        }).catch(err => {
            res.json({
                error:1
            })
        })
    } else {
        // 新增文章
        // 插入数据库
        let username = req.session.username;
        articleModel.insertMany({
            username,
            title,
            content,
            createTime
        }).then(data => {
            res.json({
                error:0,
                data
            })
        }).catch(err => {
            res.json({
                error:1
            })
        })
    }
})

router.get('/delete', (req, res, next) => {
    console.log(req);
    let id = req.query.id;
    id = new Object(id);
    // 删除
    articleModel.deleteOne({ _id: id })
        .then(data => {
            res.json({
                error:0
            })
        })
        .catch(err => {
            res.json({
                error:1
            })
        })
})


module.exports = router;