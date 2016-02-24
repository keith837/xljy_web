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
    $.get("/api/school/list",null,function(json){
        $.each(json.schools, function (i, item) {
            //添加一个学校
            $("#schoolId").append("<option value='"+item.schoolId+"'>"+item.schoolName+"</option>");
        });
        //loadClass();
    },'json');
}

function loadClass(){
    var schoolId = $("#schoolId").val();
    console.info(schoolId);
    $.get("/api/school/listClass/"+schoolId,null,function(json){
        $.each(json.classes, function (i, item) {
            //添加一个班级
            $("#classId").append("<option value='"+item.classId+"'>"+item.className+"</option>");
        });
    },'json');
}
