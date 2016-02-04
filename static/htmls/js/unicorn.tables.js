/**
 * tables
 **/
$(document).ready(function () {

    $('.data-table').dataTable({
        "oLanguage": {
            "sLengthMenu": "每页显示 _MENU_ 条记录",
            "sZeroRecords": "抱歉， 没有找到",
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
            "sProcessing": "<img src='./loading.gif' />"
        },
        "bInfo": true,
        "bJQueryUI": true,
        "bLengthChange": false,
        //"bPaginate":false,
        "sPaginationType": "full_numbers",
        "iDisplayLength": 10,
        "bFilter": false,
        "sDom": '<""l>t<"F"fp>',

        /* "iTotalRecords":10,
         "bProcessing": true,
         "bServerSide": true,*/
        "sAjaxSource": "../",
        "sServerMethod": "POST"
        /* "aoColumns": [
         { "mData": "LOG_ID" },
         { "mData": "USER_ID" },
         { "mData": "TABLE_NAME" }
         ] */
        //"fnServerParams": function (aoData) {
        //    aoData.push({ "name": "name1", "value": "value1" });
        //    aoData.push({ "name": "name2", "value": "value2" });
        //}
    });

    $('input[type=checkbox],input[type=radio],input[type=file]').uniform();

    $('select').select2();

    $("span.icon input:checkbox, th input:checkbox").click(function () {
        var checkedStatus = this.checked;
        var checkbox = $(this).parents('.widget-box').find('tr td:first-child input:checkbox');
        checkbox.each(function () {
            this.checked = checkedStatus;
            if (checkedStatus == this.checked) {
                $(this).closest('.checker > span').removeClass('checked');
            }
            if (this.checked) {
                $(this).closest('.checker > span').addClass('checked');
            }
        });
    });
});
