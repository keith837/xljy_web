/**
 * Created by lynn on 2016/2/20.
 */
//分页显示条数
var iDisplayLength = 5;
//弹窗自动关闭时间
var autoCloseTime = 2000;

//校验
function initValidator(){
    var cnmsg = {
        required: "必选字段",
        remote: "请修正该字段",
        email: "请输入正确格式的电子邮件",
        url: "请输入合法的网址",
        date: "请输入合法的日期",
        dateISO: "请输入合法的日期 (ISO).",
        number: "请输入合法的数字",
        digits: "只能输入整数",
        creditcard: "请输入合法的信用卡号",
        equalTo: "请再次输入相同的值",
        accept: "请输入拥有合法后缀名的字符串",
        maxlength: jQuery.format("请输入一个长度最多是 {0} 的字符串"),
        minlength: jQuery.format("请输入一个长度最少是 {0} 的字符串"),
        rangelength: jQuery.format("请输入一个长度介于 {0} 和 {1} 之间的字符串"),
        range: jQuery.format("请输入一个介于 {0} 和 {1} 之间的值"),
        max: jQuery.format("请输入一个最大为 {0} 的值"),
        min: jQuery.format("请输入一个最小为 {0} 的值")
    };
    jQuery.extend(jQuery.validator.messages, cnmsg);
    jQuery.validator.addMethod("isMobile", function(value, element) {
        var length = value.length;
        var mobile = /^(13[0-9]{9})|(18[0-9]{9})|(14[0-9]{9})|(17[0-9]{9})|(15[0-9]{9})$/;
        return this.optional(element) || (length == 11 && mobile.test(value));
    }, "请正确填写您的手机号码");
    jQuery.validator.addMethod("checkValue",function(value,element) {
        if (value == "-1") {
            return false;
        }
    }, "请选择下拉框值");
}


//初始化日期
function initDateTimePicker(){
    $.fn.datetimepicker.dates['zh-CN'] = {
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        today: "今日",
        suffix: [],
        meridiem: ["上午", "下午"]
    };
    $(".form_datetime").datetimepicker({
        //minView: "month", //选择日期后，不会再跳转去选择时分秒
        format: 'yyyy-mm-dd hh:ii',
        language: 'zh-CN',
        autoclose:true //选择日期后自动关闭
    });
}

function initDatePicker(){
    $.fn.datetimepicker.dates['zh-CN'] = {
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        today: "今日",
        suffix: [],
        meridiem: ["上午", "下午"]
    };
    $(".form_datetime").datetimepicker({
        //minView: "month", //选择日期后，不会再跳转去选择时分秒
        format: 'yyyy-mm-dd',
        language: 'zh-CN',
        minView:2,
        autoclose:true //选择日期后自动关闭
    });
}

//初始化datatable
function initDataTable(){
    $.fn.dataTable.ext.errMode = function(s,h,m){};
    return {
        "oLanguage": {
            "sLengthMenu": "每页显示 _MENU_ 条记录",
            "sInfo": "从 _START_ 到 _END_ /共 _TOTAL_ 条数据",
            "sInfoEmpty": "没有数据",
            "sInfoFiltered": "(从 _MAX_ 条数据中检索)",
            "oPaginate": {
                "sFirst": "首页",
                "sPrevious": "前一页",
                "sNext": "后一页",
                "sLast": "尾页"
            },
            "sZeroRecords": "没有检索到数据",
            "sProcessing": "<img src='./img/loading.gif' />"
        },
        "bInfo": true,
        "sErrMode":"throw",
//            "bInfo": true,
        "bJQueryUI": true,
        "bLengthChange": false,
//            "bPaginate":true,
        "bProcessing" : true,
        "sPaginationType": "full_numbers",
        "iDisplayLength": iDisplayLength,
        "bFilter": false,
        "sDom": '<""l>t<"F"fp>'

//            "iTotalRecords":10,/*
//             "bProcessing": true,
//        "bServerSide": true
        //"sAjaxDataProp":"data.aaData",

        //"fnServerParams": function (aoData) {
        //    aoData.push({ "name": "name1", "value": "value1" });
        //    aoData.push({ "name": "name2", "value": "value2" });
        //}
    };
}

$.ajaxSetup({
    headers: {
        "Set-Token": $.cookie('token')
    }
});
//合并json
function extend(destination, source) {
    for (var property in source)
        destination[property] = source[property];
    return destination;
}
//function extend(des, src, override){
//    if(src instanceof Array){
//        for(var i = 0, len = src.length; i < len; i++)
//            extend(des, src[i], override);
//    }
//    for( var i in src){
//        if(override || !(i in des)){
//            des[i] = src[i];
//        }
//    }
//    return des;
//}

function initNullSelect(component) {
    $(component).select2({
        data: [], initSelection: function (element, callback) {
            callback({});
        }
    });
    $(component).select2("val", -1);
}
//加载学校
function loadSchool(){
    $.ajax({
        url: "/api/school/list",    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var jsonObj = data.schools;
                var options = [];
                for (var j = 0; j < jsonObj.length; j++) {
                    options.push({id: jsonObj[j].schoolId, text: jsonObj[j].schoolName});
                }
                var schoolSelect = $("#schoolId").select2({data: options});
                if($("#classId").length==1) {
                    schoolSelect.on("change", function (e) {
                        initNullSelect("#classId");
                        if ($("#studentId").length == 1) {
                            initNullSelect("#studentId");
                        }
                        getClassInfo($(this).val());
                    });
                }
                if($("#tUserId").length==1) {
                    schoolSelect.on("change", function (e) {
                        initNullSelect("#tUserId");
                        loadTuser($(this).val(),"tUserId");
                    });
                }
            } else {
                initNullSelect("#schoolId");
            }
        },
        error: function (msg) {
            initNullSelect("#schoolId");
        }
    });
}
//加载班级
function getClassInfo(schoolId) {
    if (schoolId == "-1" || schoolId == "") {
        return;
    }
    $.ajax({
        url: "/api/school/listClass/"+schoolId,    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var jsonObj = data.classes;
                var options = [];
                for (var j = 0; j < jsonObj.length; j++) {
                    options.push({id: jsonObj[j].classId, text: jsonObj[j].className});
                }

                var classSelect = $("#classId").select2({data: options});
                if($("#studentId").length==1) {
                    classSelect.on("change", function (e) {
                        initNullSelect("#studentId");
                        getStudentInfo($(this).val());
                    });
                }
            } else {
                initNullSelect("#classId");
            }
        },
        error: function (msg) {
            initNullSelect("#classId");
        }
    });
}
//加载学生
function getStudentInfo(classId) {
    if (classId == "-1" || classId == "") {
        return;
    }
    $.ajax({
        url: "/api/student/listall?classId="+classId,    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var jsonObj = data.data;
                var options = [];
                for (var j = 0; j < jsonObj.length; j++) {
                    options.push({id: jsonObj[j].studentId, text: jsonObj[j].studentName});
                }
                $("#studentId").select2({data: options});
            } else {
                initNullSelect("#studentId");
            }
        },
        error: function (msg) {
            initNullSelect("#studentId");
        }
    });
}
//加载用户组
function loadGroup() {
    var groupId = $.cookie('groupId');
    $.ajax({
        url: "/api/group/mylist/"+groupId,    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var jsonObj = data.data;
                var options = [];
                for (var j = 0; j < jsonObj.length; j++) {
                    options.push({id: jsonObj[j].groupId, text: jsonObj[j].groupName});
                }
                $("#groupId").select2({data: options});
            } else {
                $("#groupId").select2({data: [{id: -1, text: "请选择用户组"}]});
            }
        },
        error: function (msg) {
            $("#groupId").select2({data: [{id: -1, text: "请选择用户组"}]});
        }
    });
}

function loadGroupByGroupId(groupId) {
    $.ajax({
        url: "/api/group/mylist/"+groupId,    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var jsonObj = data.data;
                var options = [];
                for (var j = 0; j < jsonObj.length; j++) {
                    options.push({id: jsonObj[j].groupId, text: jsonObj[j].groupName});
                }
                $("#groupId").select2({data: options});
            } else {
                $("#groupId").select2({data: [{id: -1, text: "请选择用户组"}]});
            }
        },
        error: function (msg) {
            $("#groupId").select2({data: [{id: -1, text: "请选择用户组"}]});
        }
    });
}
//加载用户
function loadUser(groupId,selectId) {
    $.ajax({
        url: "/api/user/list",    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        data: {groupId:groupId,iDisplayStart:0,iDisplayLength:10000000},
        contentType: "application/json",
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var options = [];
                $.each(data.data, function (i, item) {
                    options.push({id: item.userId, text: item.custName});
                })
                $("#"+selectId).select2({data: options});

            } else {
                initNullSelect("#"+selectId);
            }
        },
        error: function (msg) {
            initNullSelect("#"+selectId);
        }
    });
}

//加载园长
function loadSuser(groupId,selectId) {
    $.ajax({
        url: "/api/user/principals/"+groupId,    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var options = [];
                $.each(data.data, function (i, item) {
                    options.push({id: item.userId, text: item.custName});
                })
                $("#"+selectId).select2({data: options});

            } else {
                initNullSelect("#"+selectId);
            }
        },
        error: function (msg) {
            initNullSelect("#"+selectId);
        }
    });
}

//加载老师
function loadTuser(schoolId,selectId) {
    $.ajax({
        url: "/api/user/list",    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {schoolId:schoolId,groupId:20,iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var options = [];
                $.each(data.data, function (i, item) {
                    options.push({id: item.userId, text: item.custName});
                })
                $("#"+selectId).select2({data: options});

            } else {
                initNullSelect("#"+selectId);
            }
        },
        error: function (msg) {
            initNullSelect("#"+selectId);
        }
    });
}

//加载品牌
function loadBrand(selectId) {
    $.ajax({
        url: "/api/brand/mylist",    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var options = [];
                $.each(data.data, function (i, item) {
                    options.push({id: item.brandId, text: item.brandName});
                })
                $("#"+selectId).select2({data: options});

            } else {
                initNullSelect("#"+selectId);
            }
        },
        error: function (msg) {
            initNullSelect("#"+selectId);
        }
    });
}

//加载年级
function loadGrade(selectId) {
    $.ajax({
        url: "/api/grade/list",    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
        data: {iDisplayStart:0,iDisplayLength:10000000},
        traditional: true,
        success: function (data) {
            if (data.code == "00") {
                var options = [];
                $.each(data.data, function (i, item) {
                    options.push({id: item.gradeId, text: item.gradeName});
                })
                $("#"+selectId).select2({data: options});

            } else {
                initNullSelect("#"+selectId);
            }
        },
        error: function (msg) {
            initNullSelect("#"+selectId);
        }
    });
}
//删除
function deleteRow(text,url,type,data,table){
    swal({
        title: "确认删除?",
        text: text,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        closeOnConfirm: false
    }, function(){
        $.ajax({
            url: url,
            type: type,
            data: data,
            dataType: 'json'
        }).done(function(data) {
                if (data.code=="00") {
                    swal({   title: "删除成功!",   text: "删除数据成功",   timer: autoCloseTime,   showConfirmButton: true });
                    table.fnClearTable(); //清空一下table
                    //table.fnDestroy(); //还原初始化了的datatable
                    table.fnDraw();
                }else{
                    swal({title: "删除失败!", text:  data.msg,  type:"error", timer: autoCloseTime});
                };
        }).fail(function() {
            swal({title: "删除失败!", text:  "删除数据失败",  type:"error", timer: autoCloseTime});
        });

    });
}

//新增或修改
function saveOrUpdate(url, type, formId, backHref) {
    $.ajax({
        url: url,
        type: type,
        data: $(formId).serialize()

    }).done(function (data) {
        if (data.code == "00") {
            if(typeof(backHref) != "undefined"){
                swal({title: "保存成功!", text: "保存成功", timer: autoCloseTime, showConfirmButton: true}, function () {
                    setTimeout(function () {
                        window.location.href = backHref;
                    }, 2000);
                });
            }else{
                swal({title: "保存成功!", text: "保存成功",type:"success", timer: autoCloseTime, showConfirmButton: true});
            }


        } else {
            swal({title: "保存失败!", text:  data.msg,type:"error", timer: autoCloseTime});
        }
    }).fail(function () {
        swal({title: "保存失败!", text: "保存失败",type:"error", timer: autoCloseTime});
    });

}

//ajax提交表单
function ajaxForm(url, type, formId, backHref) {
    $(formId).ajaxForm({
        url: url,
        type: type,
        success: function (data) {
            if (data.code == "00") {
                if(typeof(backHref) != "undefined"){
                    swal({title: "保存成功!", text: "保存成功", timer: autoCloseTime, showConfirmButton: true}, function () {
                        setTimeout(function () {
                            window.location.href = backHref;
                        }, 2000);
                    });
                }else{
                    swal({title: "保存成功!", text: "保存成功",type:"success", timer: autoCloseTime, showConfirmButton: true});
                }


            } else {
                swal({title: "保存失败!", text:  data.msg,type:"error", timer: autoCloseTime});
            }
        },
        error: function (data) {
            swal({title: "保存失败!", text: "保存失败!", type: "error", timer: autoCloseTime});
        }
    });


}

// 模板下载
function ajax_download(url, data) {
    var $iframe;
    var iframe_doc;
    var iframe_html;

    if (($iframe = $('#download_iframe')).length === 0) {
        $iframe = $("<iframe id='download_iframe'" +
            " style='display: none' src='about:blank'></iframe>"
        ).appendTo("body");
    }

    iframe_doc = $iframe[0].contentWindow || $iframe[0].contentDocument;
    if (iframe_doc.document) {
        iframe_doc = iframe_doc.document;
    }

    iframe_html = "<html><head></head><body><form method='GET' action='" +
        url + "'>";
    Object.keys(data).forEach(function (key) {
        iframe_html += "<input type='hidden' name='" + key + "' value='" + data[key] + "'>";

    });
    iframe_html += "</form></body></html>";

    iframe_doc.open();
    iframe_doc.write(iframe_html);
    $(iframe_doc).find('form').submit();
}