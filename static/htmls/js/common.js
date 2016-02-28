/**
 * Created by lynn on 2016/2/20.
 */
var iDisplayLength = 5;
$.ajaxSetup({
    headers: {
        "Set-Token": $.cookie('token')
    }
});

function loadSchool(){
    $.ajax({
        url: "/api/school/list",    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
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
                        $("#classId").select2({data: [{id: -1, text: "请选择班级"}]});
                        if ($("#studentId").length == 1) {
                            $("#studentId").select2({data: [{id: -1, text: "请选择学生"}]});
                        }
                        getClassInfo($(this).val());
                    });
                }
            } else {
                $("#schoolId").select2({data: [{id: -1, text: "请选择学校"}]});
            }
        },
        error: function (msg) {
            $("#schoolId").select2({data: [{id: -1, text: "请选择学校"}]});
        }
    });
}

function getClassInfo(schoolId) {
    if (schoolId == "-1") {
        return;
    }
    $.ajax({
        url: "/api/school/listClass/"+schoolId,    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
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
                        $("#studentId").select2({data: [{id: -1, text: "请选择学生"}]});
                        getStudentInfo($(this).val());
                    });
                }
            } else {
                $("#classId").select2({data: [{id: -1, text: "请选择班级"}]});
            }
        },
        error: function (msg) {
            $("#classId").select2({data: [{id: -1, text: "请选择班级"}]});
        }
    });
}

function getStudentInfo(classId) {
    if (classId == "-1") {
        return;
    }
    $.ajax({
        url: "/api/student/listall?classId="+classId,    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
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
                $("#studentId").select2({data: [{id: -1, text: "请选择学生"}]});
            }
        },
        error: function (msg) {
            $("#studentId").select2({data: [{id: -1, text: "请选择学生"}]});
        }
    });
}

function loadGroup() {
    $.ajax({
        url: "/api/group/list",    //后台webservice里的方法名称
        type: "get",
        dataType: "json",
        contentType: "application/json",
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