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

#基本配置解析

所有配置文件全部放置在core的config目录下        
包括        
log4jsConfig log4js配置     
mysqlConfig mysql配置       
redisConfig redis配置       
routerConfig 路由配置 (已放弃)       
webConfig 服务器配置

常见配置需要修改mysql配置中的服务器地址 端口 用户名 密码 和数据库  POOLSIZE （连接池大小)       
redis 的服务器地址 端口 密码 池大小 对应的db 
基本webConfig 的STATICPATH 配置会被加载到路由控制之中的静态目录（数组）

#引入模板
系统使用的是ejs 模板引擎，默认配置好的模板目录为/app/views/目录下，修改目录可以在webconfig配置      
我们在/views目录下 新建一个文件夹test 用文件夹的方式在组织不同控制器的模板      
在test目录下我们新建一个fun1.html文件，写入自定义的模板内容 this is a tempelate     
修改testController.js 中的fun1 方法 修改输出为 response.render('test/fun1', {});        
再次打开地址，变成了我们的模板内容，模板填充的语法参见express 中使用ejs模板的相关教程，再次不赘述       


#客户端参数获取
我们常用的参数获取方式为get 或者 post 在fun1中获取到相关参数如下        

##GET 直接使用回调方法的第一个参数，假定我们定义为request 的 request.query即可获取      
##POST 直接使用回调方法的第一个参数，假定我们定义为request 的 request.body方法即可获取    

#mysql 调用
在控制器方法中使用mysql的功能只需使用this.db 对象来操作     
提供 this.db.query 和 this.db.transaction 两个方法 分别对应普通查询和事务,在app.js 最下，有基本的mysql 操作实例     

#redis 调用
在控制器方法中使用redis的功能只需使用this.redis 对象来操作 在https://github.com/NodeRedis/node_redis最下有基本的redis操作

#日志输出
日志选用的log4js,在fun1中直接使用this.logger 调用log4js的方法。

