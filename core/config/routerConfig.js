var routerConfig = {
    mapping: {
        smsNotice : {
            "usedModel": ["student/student", "school/class", "school/school", "user/user"],
            "list": {
                "url": "/api/smsNotice/list",
                "method": "get",
                "description": "查询所有家长短信设置"
            },
            "cancel": {
                "url": "/api/smsNotice/:id",
                "method": "delete",
                "description": "取消家长短信设置"
            },
            "set": {
                "url": "/api/smsNotice/:id",
                "method": "put",
                "description": "设置家长短信提醒"
            }
        },


        test: {
            "usedModel": ["user/user", "user/smsLog", "user/userLogin", "school/school", "student/student", "school/class"],
            "postXls": {
                "url": "/test/postXls",
                "method": "get",
                "description": "用户登录"
            },
            "doUploadXls": {
                "url": "/test/doUploadXls",
                "method": "post",
                "description": "用户登录"
            }
        },
        upload: {
            "usedModel": [],
            "post": {
                "url": "/api/ue/upload",
                "method": "post",
                "description": "POST请求"
            },
            "get": {
                "url": "/api/ue/upload",
                "method": "get",
                "description": "GET请求"
            }
        },

        attendance: {
            "usedModel": ["device/device", "attendance/attendance", "student/student", "school/class"],
            "attendance" : {
                "url" : "/api/student/checkTime/:macAddr",
                "method": "post",
                "description": "学生出入园"
            },
            "newAttendance" : {
                "url" : "/api/student/attendance/:macAddr",
                "method": "post",
                "description": "学生出入园(new)"
            }
        },

        user: {
            "usedModel": ["user/user", "user/smsLog", "user/userLogin", "school/school", "student/student", "school/class", "user/userAttr"],
            "login": {
                "url": "/api/user/login",
                "method": "post",
                "description": "用户登录"
            },
            "weblogin": {
                "url": "/api/user/weblogin",
                "method": "post",
                "description": "web用户登录"
            },
            "whiteCheck" : {
                "url": "/api/user/whiteCheck/:billId",
                "method": "get",
                "description": "白名单校验"
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
            "webRegister": {
                "url": "/api/user/webRegister/:userName",
                "method": "put",
                "description": "用户注册激活web端"
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
                "url": "/api/user/list",
                "method": "get",
                "description": "查询所有用户信息"
            },
            "show": {
                "url": "/api/user/show/:userId",
                "method": "get",
                "description": "查询用户信息"
            },
            "add": {
                "url": "/api/user/add",
                "method": "post",
                "description": "新增用户信息"
            },
            "del": {
                "url": "/api/user/del/:userId",
                "method": "delete",
                "description": "删除用户信息"
            },
            "modify": {
                "url": "/api/user/modify/:userId",
                "method": "put",
                "description": "修改用户信息"
            },
            "logout" : {
                "url": "/api/user/logout",
                "method": "post",
                "description": "退出登录"
            },
            "uppic" : {
                "url": "/api/user/uppic",
                "method": "put",
                "description": "上传用户头像"
            },
            principals : {
                "url": "/api/user/principals/:groupId",
                "method": "get",
                "description": "获取学校编号为空的用户信息"
            },
            addAttr : {
                "url": "/api/user/addAttr/:userId/:attrType",
                "method": "post",
                "description": "添加用户属性"
            },
            delAttr : {
                "url": "/api/user/delAttr/:userId/:attrType/:doneCode",
                "method": "delete",
                "description": "删除用户属性"
            },
            showTeacher : {
                "url": "/api/user/showTeacher/:userId",
                "method": "get",
                "description": "教师档案"
            },
            restDevice : {
                "url": "/api/user/restDevice",
                "method": "put",
                "description": "重置设备信息"
            },
            listGroupUser : {
                "url": "/api/user/listGroupUser",
                "method": "get",
                "description": "查询集团园长"
            },
            syncYun : {
                "url": "/api/user/syncYun/:yunUser",
                "method": "put",
                "description": "同步云信息"
            },
            syncAllYun : {
                "url": "/api/user/syncYuns",
                "method": "put",
                "description": "全量同步云信息"
            },
            getYun :{
                "url": "/api/user/getYun/:yunUser",
                "method": "get",
                "description": "获取云账号信息"
            },
            deleteAllYun :{
                "url": "/api/user/syncYuns",
                "method": "delete",
                "description": "全量删除云信息"
            },
            deleteSingleYun :{
                "url": "/api/user/delYuns/:userId",
                "method": "delete",
                "description": "单个删除云信息"
            }
        },

        menu : {
            "usedModel": ["base/menu"],
            "list": {
                "url": "/api/menu/list",
                "method": "get",
                "description": "查询菜单"
            },
            "listRoles": {
                "url": "/api/role/listRoles",
                "method": "get",
                "description": "查询角色"
            }
        },
        group : {
            "usedModel": ["group/group"],
            "remove": {
                "url": "/api/group/remove/:groupId",
                "method": "delete",
                "description": "删除用户组"
            },
            "list": {
                "url": "/api/group/list",
                "method": "get",
                "description": "查询用户组"
            },
            "create": {
                "url": "/api/group/create",
                "method": "post",
                "description": "编辑用户组"
            },
            "mylist" : {
                "url": "/api/group/mylist/:groupId",
                "method": "get",
                "description": "查询当前用户可操作的用户组"
            }
        },
        school : {
            "usedModel": ["school/school","school/class", "student/studentLeave", "attendance/attendance", "student/sports", "school/grade"],
            "select": {
                "url": "/api/school/select/:schoolId",
                "method": "post",
                "description": "选择园所"
            },
            "list": {
                "url": "/api/school/list",
                "method": "get",
                "description": "查询园所"
            },
            "listClass": {
                "url": "/api/school/listClass/:schoolId",
                "method": "get",
                "description": "查询校长园所"
            },
            "listall": {
                "url": "/api/school/listall",
                "method": "get",
                "description": "查询所有园所"
            },
            "show": {
                "url": "/api/school/show/:schoolId",
                "method": "get",
                "description": "查询园所"
            },
            "del": {
                "url": "/api/school/del/:schoolId",
                "method": "delete",
                "description": "删除园所"
            },
            "modify": {
                "url": "/api/school/modify/:schoolId",
                "method": "put",
                "description": "修改园所"
            },
            "brandChange": {
                "url": "/api/school/brand/:schoolId",
                "method": "put",
                "description": "修改园所品牌"
            },
            "add": {
                "url": "/api/school/add",
                "method": "post",
                "description": "新增园所"
            },
            "teachers" : {
                "url": "/api/school/teachers/:schoolId",
                "method": "get",
                "description": "学校老师查询"
            },
            "webTeachers" : {
                "url": "/api/school/webTeachers/:schoolId",
                "method": "get",
                "description": "学校老师查询"
            },
            "countAttendance" : {
                "url": "/api/school/countAttendance/:schoolId",
                "method": "get",
                "description": "学校学生出勤信息统计"
            },
            "classes" : {
                "url": "/api/school/classes",
                "method": "get",
                "description": "学校班级查询"
            },
            "grades" : {
                "url": "/api/school/grades/:schoolId",
                "method": "get",
                "description": "学校年级查询"
            }
        },
        recom: {
            "usedModel": ['recom/recom', "school/school"],
            "list": {
                "url": "/api/recom",
                "method": "get",
                "description": "当日推荐列表"
            },
            "add": {
                "url": "/api/recom",
                "method": "post",
                "description": "添加推荐"
            },
            "del": {
                "url": "/api/recom/:consultId",
                "method": "delete",
                "description": "删除推荐"
            },
            "update": {
                "url": "/api/recom/:consultId",
                "method": "put",
                "description": "更新推荐"
            },
            "show": {
                "url": "/api/recom/show/:consultId",
                "method": "get",
                "description": "查询推荐"
            },
            "weblist": {
                "url": "/api/recom/showall",
                "method": "get",
                "description": "web推荐列表"
            },
            "school": {
                "url": "/api/recom/school/:id",
                "method": "get",
                "description": "校园风采"
            }
        },
        brand : {
            "usedModel": ["school/brand", "school/school"],
            "list": {
                "url": "/api/brand/list",
                "method": "get",
                "description": "查询所有品牌"
            },
            "mylist": {
                "url": "/api/brand/mylist",
                "method": "get",
                "description": "查询当前用户所有品牌"
            },
            "show": {
                "url": "/api/brand/show/:brandId",
                "method": "get",
                "description": "查询品牌"
            },
            "del": {
                "url": "/api/brand/del/:brandId",
                "method": "delete",
                "description": "删除品牌"
            },
            "modify": {
                "url": "/api/brand/modify/:brandId",
                "method": "put",
                "description": "修改品牌"
            },
            "add": {
                "url": "/api/brand/add",
                "method": "post",
                "description": "新增品牌"
            }
        },

        grade : {
            "usedModel": ["school/grade", "school/school"],
            "list": {
                "url": "/api/grade/list",
                "method": "get",
                "description": "查询所有年级"
            },
            "detail": {
                "url": "/api/grade/detail/:id",
                "method": "get",
                "description": "查询年级"
            },
            "add": {
                "url": "/api/grade/add",
                "method": "post",
                "description": "新增年级"
            },
            "update": {
                "url": "/api/grade/update/:id",
                "method": "put",
                "description": "更新年级"
            },
            "del": {
                "url": "/api/grade/:id",
                "method": "delete",
                "description": "删除年级"
            }
        },

        student : {
            "usedModel": ["student/student", "student/sports", "school/class", "school/school", "student/studentLeave", "attendance/attendance", "user/user", 'device/device', 'student/lost','notice/notice'],
            "select": {
                "url": "/api/student/select/:studentId",
                "method": "post",
                "description": "选择学生"
            },
            "list": {
                "url": "/api/student/list",
                "method": "get",
                "description": "查询学生"
            },
            "listall": {
                "url": "/api/student/listall",
                "method": "get",
                "description": "查询所有学生"
            },
            "show": {
                "url": "/api/student/show/:studentId",
                "method": "get",
                "description": "查询学生"
            },
            "del": {
                "url": "/api/student/del/:studentId",
                "method": "delete",
                "description": "查询学生"
            },
            "modify": {
                "url": "/api/student/modify/:studentId",
                "method": "put",
                "description": "查询学生"
            },
            "add": {
                "url": "/api/student/add",
                "method": "post",
                "description": "查询学生"
            },
            "leave": {
                "url": "/api/student/leave",
                "method": "post",
                "description": "请假申请"
            },
            "cancelLeave": {
                "url": "/api/student/cancelLeave/:leaveId",
                "method": "put",
                "description": "取消请假申请"
            },
            "approveLeave": {
                "url": "/api/student/approveLeave/:leaveId",
                "method": "put",
                "description": "审批请假申请"
            },
            "showLeave": {
                "url": "/api/student/showLeave/:leaveId",
                "method": "get",
                "description": "请假申请查询(单)"
            },
            "listLeaves": {
                "url": "/api/student/listLeaves",
                "method": "get",
                "description": "当前请假申请查询"
            },
            "parents": {
                "url": "/api/student/parents/:studentId",
                "method": "get",
                "description": "学生家长查询"
            },
            "countAttendance" : {
                "url": "/api/student/countAttendance/:studentId",
                "method": "get",
                "description": "学生出勤信息统计"
            },
            "listAttendance" : {
                "url": "/api/student/listAttendance/:studentId",
                "method": "get",
                "description": "学生出勤信息"
            },
            "uppic" : {
                "url": "/api/student/uppic",
                "method": "put",
                "description": "学生头像上传"
            },
            "activities" : {
                "url": "/api/student/activities/:studentId",
                "method": "get",
                "description": "学生运动量统计"
            },
            "addSports" : {
                "url": "/api/student/activity/:studentId",
                "method": "post",
                "description": "上传运动量"
            },
            "addBatchSports" : {
                "url": "/api/student/activities/:studentId",
                "method": "post",
                "description": "批量上传运动量"
            },
            "delSports" : {
                "url": "/api/student/activities",
                "method": "delete",
                "description": "删除运动量"
            },
            "lost" : {
                "url": "/api/student/lost/:studentId",
                "method": "post",
                "description": "发布宝贝走失记录"
            },
            "upLostPic" : {
                "url": "/api/student/upLostPic/:lostId",
                "method": "post",
                "description": "上传宝贝走失图片"
            },
            "nextLost" : {
                "url": "/api/student/nextLost/:index",
                "method": "get",
                "description": "获取下条宝贝走失记录"
            },
            "unlost" : {
                "url": "/api/student/unlost/:studentId",
                "method": "post",
                "description": "删除宝贝丢失记录"
            },
            "upPosition" : {
                "url": "/api/student/upPosition/:lostId",
                "method": "post",
                "description": "上传走失宝贝位置信息"
            },
            "listLost" : {
                "url": "/api/student/listLost",
                "method": "get",
                "description": "获取宝贝丢失记录"
            },
            "webListLost" : {
                "url": "/api/student/webLost",
                "method": "get",
                "description": "获取宝贝丢失记录"
            },
            "lostPosition" : {
                "url": "/api/student/lostPosition/:studentId",
                "method": "get",
                "description": "获取宝贝丢失位置信息"
            }
        },

        class : {
            "usedModel": ["school/class", "student/student", "student/studentLeave", "attendance/attendance", "student/sports"],
            "list": {
                "url": "/api/class/list",
                "method": "get",
                "description": "查询所有班级"
            },
            "weblist": {
                "url": "/api/class/weblist",
                "method": "get",
                "description": "查询所有班级(WEB端)"
            },
            "show": {
                "url": "/api/class/show/:classId",
                "method": "get",
                "description": "查询班级"
            },
            "showDetail": {
                "url": "/api/class/showDetail/:classId",
                "method": "get",
                "description": "查询班级及老师"
            },
            "add": {
                "url": "/api/class/add",
                "method": "post",
                "description": "新增班级"
            },
            "modify": {
                "url": "/api/class/modify/:classId",
                "method": "put",
                "description": "修改班级"
            },
            "del": {
                "url": "/api/class/del/:classId",
                "method": "delete",
                "description": "删除班级"
            },
            "addTeacher" : {
                "url": "/api/class/addTeacher/:classId",
                "method": "post",
                "description": "班级关联老师"
            },
            "delTeacher" : {
                "url": "/api/class/delTeacher/:classId",
                "method": "delete",
                "description": "班级关联老师"
            },
            "teachers" : {
                "url": "/api/class/teachers",
                "method": "get",
                "description": "班级老师通讯录"
            },
            "teacherAndPrincipal" : {
                "url": "/api/class/teacherAndPrincipal",
                "method": "get",
                "description": "班级老师和校长查询"
            },
            "principal":{
                "url": "/api/class/principal/:classId",
                "method": "get",
                "description": "班级园长查询"
            },
            "students" : {
                "url": "/api/class/students/:classId",
                "method": "get",
                "description": "班级学生成员"
            },
            "parents" : {
                "url": "/api/class/parents/:classId",
                "method": "get",
                "description": "班级家长成员"
            },
            "graduate" : {
                "url": "/api/class/graduate/:classId",
                "method": "put",
                "description": "设置班级为毕业状态"
            },
            "upgrade" : {
                "url": "/api/class/upgrade/:classId",
                "method": "put",
                "description": "设置班级为毕业状态"
            }
        },

        trends : {
            "usedModel": ["album/album", "user/user"],
            "create": {
                "url": "/api/trends/create",
                "method": "post",
                "description": "发布动态"
            },
            "uppic": {
                "url": "/api/trends/uppic/:trendsId",
                "method": "post",
                "description": "上传动态图片"
            },
            "delete": {
                "url": "/api/trends/del/:trendsId",
                "method": "delete",
                "description": "删除动态"
            },
            "like": {
                "url": "/api/trends/like/:trendsId",
                "method": "post",
                "description": "动态点赞"
            },
            "comment": {
                "url": "/api/trends/comment/:trendsId",
                "method": "post",
                "description": "动态评论"
            },
            "delComment": {
                "url": "/api/trends/comment/:commentId",
                "method": "delete",
                "description": "评论删除"
            },
            "moreComment": {
                "url": "/api/trends/moreComment/:trendsId",
                "method": "get",
                "description": "更多评论"
            },
            "morePic": {
                "url": "/api/trends/morePic/:trendsId",
                "method": "get",
                "description": "更多图片"
            },
            "list": {
                "url": "/api/trends/list",
                "method": "get",
                "description": "查看动态"
            },
            "applist": {
                "url": "/api/trends/applist/:trendsId",
                "method": "get",
                "description": "app端查看动态"
            },
            "show": {
                "url": "/api/trends/show/:trendsId",
                "method": "get",
                "description": "查询动态详情"
            },
            "mylist": {
                "url": "/api/trends/list/:userId",
                "method": "get",
                "description": "查看用户动态"
            },
            "appmylist": {
                "url": "/api/trends/applist/:userId/:trendsId",
                "method": "get",
                "description": "app查看用户动态"
            },
            "top": {
                "url": "/api/trends/top/:trendsId/:isTop",
                "method": "put",
                "description": "动态置顶及下移"
            },
            "unlike": {
                "url": "/api/trends/unlike/:trendsId",
                "method": "put",
                "description": "动态取消点赞"
            }
        },
        station: {
            "usedModel": ['station/station', "school/school"],
            "list": {
                "url": "/api/stations",
                "method": "get",
                "description": "基站列表"
            },
            "detail": {
                "url": "/api/stations/:id",
                "method": "get",
                "description": "查询基站详情"
            },
            "addStation": {
                "url": "/api/stations",
                "method": "post",
                "description": "添加基站"
            },
            "delStation": {
                "url": "/api/stations/:id",
                "method": "delete",
                "description": "删除基站"
            },
            "updateStation": {
                "url": "/api/stations/:id",
                "method": "put",
                "description": "更新基站"
            }
        },
        device: {
            "usedModel": ['device/device'],
            "list": {
                "url": "/api/devices",
                "method": "get",
                "description": "手环设备列表"
            },
            "detail": {
                "url": "/api/devices/:id",
                "method": "get",
                "description": "查询手环详情"
            },
            "addDevice": {
                "url": "/api/devices",
                "method": "post",
                "description": "添加手环"
            },
            "delDevice": {
                "url": "/api/devices/:id",
                "method": "delete",
                "description": "删除手环"
            },
            "updateDevice": {
                "url": "/api/devices/:id",
                "method": "put",
                "description": "更新手环"
            }
        },
        notice: {
            "usedModel": ['notice/notice','student/studentLeave'],
            "list": {
                "url": "/api/notices",
                "method": "get",
                "description": "查询通知列表"
            },
            "publish": {
                "url": "/api/notices",
                "method": "post",
                "description": "发布通知"
            },
            "del": {
                "url": "/api/notices/:id",
                "method": "delete",
                "description": "删除通知"
            },
            "details": {
                "url": "/api/notices/:id",
                "method": "get",
                "description": "查看通知详情"
            },
            "edit": {
                "url": "/api/notices/:id",
                "method": "put",
                "description": "编辑通知"
            },
            "userList": {
                "url": "/api/notices/user/:userId",
                "method": "get",
                "description": "用户发布的通知列表"
            },
            "classList": {
                "url": "/api/notices/class/:classId",
                "method": "get",
                "description": "班级的所有通知列表"
            },
            "addPic": {
                "url": "/api/notices/:noticeId/add",
                "method": "put",
                "description": "添加图片"
            },
            "delPic": {
                "url": "/api/notices/:noticeId/:id",
                "method": "delete",
                "description": "删除图片"
            },
            "morePic": {
                "url": "/api/notices/:noticeId/pic",
                "method": "get",
                "description": "查看更多图片"
            },
            "readNotice": {
                "url": "/api/notices/unread/:userId",
                "method": "get",
                "description": "读取未读通知"
            }
        },
        notes: {
            "usedModel": ['notes/notes'],
            "list": {
                "url": "/api/notes",
                "method": "get",
                "description": "查询工作日记列表"
            },
            "publish": {
                "url": "/api/notes",
                "method": "post",
                "description": "发布工作日记"
            },
            "del": {
                "url": "/api/notes/:id",
                "method": "delete",
                "description": "删除工作日记"
            },
            "details": {
                "url": "/api/notes/:id",
                "method": "get",
                "description": "查看工作日记详情"
            },
            "edit": {
                "url": "/api/notes/:id",
                "method": "put",
                "description": "编辑工作日记"
            }
        },
        photos: {
            "usedModel": ["photos/photos", "user/user"],
            "publish": {
                "url": "/api/photos",
                "method": "post",
                "description": "发布相册"
            },
            "delete": {
                "url": "/api/photos/:id",
                "method": "delete",
                "description": "删除相册"
            },
            "like": {
                "url": "/api/photos/like/:id",
                "method": "put",
                "description": "相册点赞"
            },
            "show": {
                "url": "/api/photos/show/:albumId",
                "method": "get",
                "description": "查询相册详情"
            },
            "addPhoto": {
                "url": "/api/photos/:albumId/add",
                "method": "put",
                "description": "添加照片"
            },
            "delPhoto": {
                "url": "/api/photos/:albumId/:id",
                "method": "delete",
                "description": "删除照片"
            },
            "unlike": {
                "url": "/api/photos/unlike/:id",
                "method": "put",
                "description": "相册取消点赞"
            },
            "comment": {
                "url": "/api/photos/comment/:id",
                "method": "put",
                "description": "相册评论"
            },
            "moreComment": {
                "url": "/api/photos/:albumId/comments",
                "method": "get",
                "description": "更多相册评论"
            },
            "delComment": {
                "url": "/api/photos/comment/:commentId/del",
                "method": "delete",
                "description": "评论删除"
            },
            "morePhoto": {
                "url": "/api/photos/:albumId/photo",
                "method": "get",
                "description": "查看更多照片"
            },
            "list": {
                "url": "/api/photos",
                "method": "get",
                "description": "查看相册"
            },
            "edit": {
                "url": "/api/photos/:id",
                "method": "put",
                "description": "编辑相册"
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
        },
        batch: {
            "exportXls": {
                "url": "/api/batch/export/:bizType",
                "method": "post",
                "description": "批量导出"
            },
            "uploadXls": {
                "url": "/api/batch/import/:bizType",
                "method": "post",
                "description": "批量导入"
            },
            "template": {
                "url": "/api/batch/template/:bizType",
                "method": "get",
                "description": "模板下载"
            },
            "results": {
                "url": "/api/batch/results/:batchId",
                "method": "get",
                "description": "显示导入结果"
            }
        },
        weight: {
            "usedModel": ["student/weight"],
            "list": {
                "url": "/api/weight/list",
                "method": "get",
                "description": "学生身高体重列表"
            },
            "del": {
                "url": "/api/weight/:recordId",
                "method": "delete",
                "description": "删除记录"
            },
            "add": {
                "url": "/api/weight",
                "method": "post",
                "description": "新增身高体重数据"
            },
            "modify": {
                "url": "/api/weight/:recordId",
                "method": "put",
                "description": "更新记录"
            },
            "show": {
                "url": "/api/weight/:recordId",
                "method": "get",
                "description": "查询记录详情"
            }
        },
        activity: {
            "usedModel": ["photos/activity", "user/user", "photos/photos"],
            "publish": {
                "url": "/api/activity",
                "method": "post",
                "description": "发布精彩活动"
            },
            "publishPost": {
                "url": "/api/activity/:activityId/posts",
                "method": "post",
                "description": "发布精彩活动帖子"
            },
            "delete": {
                "url": "/api/activity/:id",
                "method": "delete",
                "description": "删除精彩活动"
            },
            "deletePost": {
                "url": "/api/activity/:activityId/:albumId",
                "method": "delete",
                "description": "删除精彩活动帖子"
            },
            "like": {
                "url": "/api/activity/:activityId/:albumId/like",
                "method": "put",
                "description": "点赞帖子"
            },
            "unlike": {
                "url": "/api/activity/:activityId/:albumId/unlike",
                "method": "delete",
                "description": "取消点赞帖子"
            },
            "comment": {
                "url": "/api/activity/:activityId/:albumId/comment",
                "method": "put",
                "description": "评论帖子"
            },
            "delComment": {
                "url": "/api/activity/:activityId/:albumId/comment/:commentId",
                "method": "delete",
                "description": "删除评论帖子"
            },
            "list": {
                "url": "/api/activity",
                "method": "get",
                "description": "精彩活动列表"
            },
            "addPhoto": {
                "url": "/api/activity/:activityId/:albumId/photo",
                "method": "put",
                "description": "添加照片"
            },
            "delPhoto": {
                "url": "/api/activity/:activityId/:albumId/photo/:id",
                "method": "delete",
                "description": "删除照片"
            },
            "edit": {
                "url": "/api/activity/:activityId/:albumId",
                "method": "put",
                "description": "编辑帖子"
            }
        },
        statistic: {
            "usedModel": ["student/sports", "school/school", "school/class", "attendance/attendance"],
            "showStatistic": {
                "url": "/api/statistic/:schoolId",
                "method": "get",
                "description": "班级考勤和平均运动量统计"
            }
        }
    }
}

module.exports = routerConfig;
