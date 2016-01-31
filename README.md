# xljy_web
响亮WEB SERVER 文档

#安装
git clone https://github.com/keith837/xljy_web.git    
cd xljy_web
npm install 

#启动 
node app

#目录介绍
/app (主要开发目录)  
/core(核心目录)  
/static(静态资源)  
/app.js(入口文件)
/package.json(包定义)

#开发指南
1:建立控制器    
/app/controllers/目录下建立  xxxController.js 文件    
填入初始化内容

> /**
 * Created by pz on 16/1/31.
 */
var formidable = require("formidable");
var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    mapping: {
        "fun1": {
            "url": "/test/fun1",    //路由地址
            "method": "get",        //请求方法
            "description": "简单的hello world例子"  //简介
        }},
    fun1:function(request,response){
    }
})

其中mapping 为该控制器下 所有方法定义的一个集合，按照属性内容填入每个路由方法的相关信息，包括url 路由地址，method :响应方法 description 定义等。其中该对象的键名，如fun1 需对应一个mapping 对象同级别的同名方法fun1,实现映射.

这时我们该路由下所有的业务逻辑全部在fun1方法中完成。

自动挂在的路由方法有2个入参 request,和response 对应express 的2个入参，可以按照express 的方法直接使用。

代码的上部我们可以看见自定义的控制器方法是由一个basicController继承而来

basicController 实现了一些常用工具的挂载，比如DB (Mysql 连接池) redis 缓存，日志组件，文件组件 等其他组件的挂载，我们在fun1方法中可以直接使用

    this.db.query(sql,[],function(){});

等方法直接使用，具体使用实例后叙。

控制器文件书写完毕后 我们把fun1方法修改一下，添加一行输出

>  fun1:function(request,response){
        response.send("hello world!");
    }

这时候启动我们的服务器 node app.js后 访问 localhost:3001/test/fun1 后结果如下

    hello world!

路由器最基本的功能实现完成。

