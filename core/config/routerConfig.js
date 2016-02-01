var routerConfig = {
    mapping: {
        user: {
            "userShow": {
                "url": "/user/show",
                "method": "get",
                "description": "简单的hello world例子",
                "auth": true
            },
            "show": {
                "url": "/show",
                "method": "get",
                "description": "简单的hello world例子",
                "auth": true
            },
            "upload": {
                "url": "/uploads",
                "method": "post",
                "description": "操作User表",
                "auth": false
            }
        },
        cm: {
            "showlist": {
                "url": "/cm/list",
                "method": "get",
                "description": "显示文章列表",
                "auth": true
            }
        },
        test: {
            "fun1": {
                "url": "/test/fun1",    //路由地址
                "method": "post",        //请求方法
                "description": "简单的hello world例子"  //简介
            },
            "fun2": {
                "url": "/test/fun2",    //路由地址
                "method": "get",        //请求方法
                "description": "简单的hello world例子"  //简介
            },

        }
    }
}

module.exports = routerConfig;