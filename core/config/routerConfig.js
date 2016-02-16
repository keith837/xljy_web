var routerConfig = {
    mapping: {
        user: {
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
        },
        device: {
            "usedModel": ['device/device'],
            "devicelist": {
                "url": "/api/device/list",
                "method": "post",
                "description": "设备列表"
            },
            "devicelist2": {
                "url": "/api/device/list2",
                "method": "get",
                "description": "设备列表"
            }
        },
        app: {
            "usedModel": [],
            "info": {
                "url": "/api/soft/info",
                "method": "get",
                "description": "软件介绍，技术支持"
            }
        },
        point: {
            "usedModel": ["point/point"],
            "show": {
                "url": "/api/point/show/:userId",
                "method": "get",
                "description": "获取用户积分变更记录"
            },
            "update": {
                "url": "/api/point/update",
                "method": "post",
                "description": "积分变更"
            },
            "list": {
                "url": "/api/point/list",
                "method": "get",
                "description": "积分列表"
            }
        }
    }
}

module.exports = routerConfig;