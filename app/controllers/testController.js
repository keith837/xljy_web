/**
 * Created by pz on 16/1/31.
 */
var formidable = require("formidable");
var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    mapping: {
        "fun1": {
            "url": "/test/fun1",    //路由地址
            "method": "post",        //请求方法
            "description": "简单的hello world例子"  //简介
        },"fun2": {
            "url": "/test/fun2",    //路由地址
            "method": "get",        //请求方法
            "description": "简单的hello world例子"  //简介
        }},
    fun1:function(request,response){
        console.log('===============');
        console.log(request.body);
        response.json({a1:request.body,a2:2});
        response.end();
        //response.render('test/fun1', {});
    },
    fun2:function(request,response){
        console.log(request.body);
        response.render('test/fun1', {});
    }
})
