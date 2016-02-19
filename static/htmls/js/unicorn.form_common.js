/**
 * form
 **/
$(document).ready(function () {

    $('input[type=checkbox],input[type=radio],input[type=file]').uniform({
            fileDefaultText: '未选择文件',
            fileBtnText: '浏览'
    });

    $('select').select2();
    //$('.colorpicker').colorpicker();
   // $('.datepicker').datepicker();
});
