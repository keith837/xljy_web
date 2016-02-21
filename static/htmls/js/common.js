/**
 * Created by lynn on 2016/2/20.
 */
var iDisplayLength = 5;
$.ajaxSetup({
    headers: {
        "Set-Token": $.cookie('token')
    }
});
