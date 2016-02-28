/**
 * Created by lynn on 2016/2/20.
 */
var iDisplayLength = 5;
$.ajaxSetup({
    headers: {
        "Set-Token": $.cookie('token')
    }
});

function initNullSelect(component) {
    $(component).select2({
        data: [], initSelection: function (element, callback) {
            callback({});
        }
    });
    $(component).select2("val", -1);
}

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
                        initNullSelect("#classId");
                        if ($("#studentId").length == 1) {
                            initNullSelect("#studentId");
                        }
                        getClassInfo($(this).val());
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

function getClassInfo(schoolId) {
    if (schoolId == "-1" || schoolId == "") {
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

function getStudentInfo(classId) {
    if (classId == "-1" || classId == "") {
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
                initNullSelect("#studentId");
            }
        },
        error: function (msg) {
            initNullSelect("#studentId");
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

function saveOrUpdate(url, type, formId, backHref) {
    $.ajax({
        url: url,
        type: type,
        data: $(formId).serialize()

    }).done(function (data) {
        if (data.code == "00") {
            swal({title: "保存成功!", text: "保存成功", timer: 1000, showConfirmButton: true}, function () {
                setTimeout(function () {
                    window.location.href = backHref;
                }, 2000);
            });

        } else {
            swal("保存失败!", data.msg, "error");
        }
    }).fail(function () {
        swal("保存失败!", "保存失败", "error");
    });

}