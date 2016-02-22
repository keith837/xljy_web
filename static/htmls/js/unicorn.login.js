/**
 * login
 **/
$(document).ready(function () {

    var login = $('#loginform');
    var recover = $('#recoverform');
    var speed = 400;

    $('#loginBtn').click(function () {
        //console.info($("#loginform").serializeArray());
        $.ajax({
            url: "/api/user/weblogin",
            type: "POST",
            data: $("#loginform").serialize()
        }).done(function(data) {
            if (data.code=="00") {
                //console.info(data);
                $.cookie('token', data.data.token);
                swal({   title: "登陆成功!",   text: "登陆成功",   timer: 1000,   showConfirmButton: true },function(){
                    setTimeout(function(){
                       window.location.href="main.html";
                    }, 500);
                });

            }else{
                swal("登陆失败!", data.msg, "error");
            };
        })
        .fail(function() {
            swal("登陆失败!", "登陆失败", "error");
        });
    });

    $('#to-recover').click(function () {
        login.fadeTo(speed, 0.01).css('z-index', '100');
        recover.fadeTo(speed, 1).css('z-index', '200');
    });

    $('#to-login').click(function () {
        recover.fadeTo(speed, 0.01).css('z-index', '100');
        login.fadeTo(speed, 1).css('z-index', '200');
    });

    if ($.browser.msie == true && $.browser.version.slice(0, 3) < 10) {
        $('input[placeholder]').each(function () {

            var input = $(this);

            $(input).val(input.attr('placeholder'));

            $(input).focus(function () {
                if (input.val() == input.attr('placeholder')) {
                    input.val('');
                }
            });

            $(input).blur(function () {
                if (input.val() == '' || input.val() == input.attr('placeholder')) {
                    input.val(input.attr('placeholder'));
                }
            });
        });


    }
});