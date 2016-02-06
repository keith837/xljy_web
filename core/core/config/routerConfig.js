var routerConfig = {
    mapping: {
        user: {
<<<<<<< HEAD
            "usedModel": ["user/user", "user/smsLog", "user/userLogin", "school/school", "student/student", "school/class"],
            "login": {
                "url": "/api/user/login",
                "method": "post",
                "description": "用户登录"
            },
            "resetPwd": {
                "url": "/api/user/resetPwd",
                "method": "post",
                "description": "用户密码重置"
            },
            "register": {
                "url": "/api/user/register",
                "method": "post",
                "description": "用户注册激活"
            },
            "getSecurityCode": {
                "url": "/api/user/securityCode/:billId",
                "method": "get",
                "description": "获取激活码"
            },
            "modifyPwd": {
                "url": "/api/user/modifyPwd",
                "method": "post",
                "description": "修改密码"
            },
            "list": {
                "url": "/api/user/list/:groupId",
                "method": "get",
                "description": "查询所有用户信息"
            },
            "show": {
                "url": "/api/user/show/:userId",
                "method": "get",
                "description": "查询用户信息"
            }
        },
        school : {
            "usedModel": ["school/school"],
            "select": {
                "url": "/api/school/select/:schoolId",
                "method": "post",
                "description": "选择园所"
            },
            "list": {
                "url": "/api/school/list",
                "method": "get",
                "description": "查询园所"
            }
        },
        student : {
            "usedModel": ["student/student"],
            "select": {
                "url": "/api/student/select/:studentId",
                "method": "post",
                "description": "选择学生"
            },
            "list": {
                "url": "/api/student/list",
                "method": "get",
                "description": "查询学生"
            }
        },
        trends : {
            "usedModel": ["album/album"],
            "create": {
                "url": "/api/trends/create",
                "method": "post",
                "description": "发布动态"
            },
            "delete": {
                "url": "/api/trends/delete/:trendsId",
                "method": "del",
                "description": "删除动态"
            },
            "like": {
                "url": "/api/trends/like/:trendsId",
                "method": "put",
                "description": "动态点赞"
            },
            "comment": {
                "url": "/api/trends/comment/:trendsId/:content",
                "method": "put",
                "description": "动态评论"
            },
            "list": {
                "url": "/api/trends/list",
                "method": "get",
                "description": "查看动态"
            },
            "show": {
                "url": "/api/trends/show/:userId",
                "method": "get",
                "description": "查看我的动态"
            },
            "top": {
                "url": "/api/trends/top/:trendsId/:isTop",
                "method": "put",
                "description": "动态置顶及下移"
            }
=======
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

>>>>>>> remotes/origin/master
        },
        device: {
            "usedModel": ['device/device'],
            "devicelist": {
                "url": "/device/list",
                "method": "post",
                "description": "设备列表"
            },
            "devicelist2": {
                "url": "/device/list2",
                "method": "get",
                "description": "设备列表"
            }
        }
    }
}

module.exports = routerConfig;