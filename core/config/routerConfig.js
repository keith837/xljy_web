var routerConfig = {
    mapping: {
        user: {
            "usedModel": ["student/student", "student/studentLeave"],    //
            "userShow": {
                "url": "/user/show",
                "method": "get",
                "description": "简单的hello world例子"
            },
            "show": {
                "url": "/show",
                "method": "get",
                "description": "简单的hello world例子"
            },
            "upload": {
                "url": "/uploads",
                "method": "post",
                "description": "操作User表"
            }
        },
        cm: {
            "usedModel": ["student/student", "student/studentLeave"],
            "showlist": {
                "url": "/cm/list",
                "method": "get",
                "description": "显示文章列表"
            }
        },
        test: {
            "doUploadXls": {
                "url": "/test/doUploadXls",    //路由地址
                "method": "post",        //请求方法
                "description": "fun1"  //简介
            },
            "postXls": {
                "url": "/test/postXls",    //路由地址
                "method": "get",        //请求方法
                "description": "上传xls 提交页"  //简介
            }

        },
        device: {
            "devicelist": {
                "url": "/device/list",
                "method": "post",
                "description": "设备列表"
            }
        }
    }
}

module.exports = routerConfig;