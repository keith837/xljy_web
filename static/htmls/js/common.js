/**
 * Created by lynn on 2016/2/20.
 */

$.ajaxSetup({
    headers: {
        "Set-Token": $.cookie('Set-Token')
    }
});
