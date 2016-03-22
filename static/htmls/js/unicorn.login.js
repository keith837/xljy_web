/**
 * login
 **/
var expiresTime = 7;
$(document).ready(function () {
    initValidator();
    var login = $('#loginform');
    var recover = $('#recoverform');
    var speed = 400;
    var msg = $.url.param('msg');
    if (msg) {
        swal({title: msg, text: msg,type:"warning" ,timer: 1000, showConfirmButton: true}, function () {

            setTimeout(function () {
                window.top.location = "login.html";
            }, 1000);
        });
    }

    $("#loginform").validate({
        ignore: ".ignore",
        rules:{
            userName:{
                required:true,
                isMobile:true
            },
            password:{
                required:true
            }
        },
        errorClass: "help-inline",
        errorElement: "span",
        highlight:function(element, errorClass, validClass) {
            $(element).parents('.control-group').addClass('error');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).parents('.control-group').removeClass('error');
            $(element).parents('.control-group').addClass('success');
        },
        submitHandler: function(form) {
            var tmpPassword = $("#password").val();
            $("#password").val(hex_md5(tmpPassword));
            $.ajax({
                url: "/api/user/weblogin",
                type: "POST",
                data: $("#loginform").serialize()
            }).done(function(data) {
                if (data.code=="00") {
                    //console.info(data);
                    $.cookie('token', data.data.token);
                    $.cookie('userId', data.data.userId);
                    $.cookie('groupId', data.data.groupId);
                    swal({   title: "登陆成功!",   text: "登陆成功",  type: "success", timer: 1000,   showConfirmButton: true },function(){
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
        }
    });

    $('#smsBtn').click(function () {
        var loginUserName = $("#loginUserName").val();
        if(loginUserName==null || ""==loginUserName){
            swal({   title: "请输入登录手机号",  type: "warning", timer: 1000,   showConfirmButton: true });
            return;
        }
        var length = loginUserName.length;
        var mobile = /^(13[0-9]{9})|(18[0-9]{9})|(14[0-9]{9})|(17[0-9]{9})|(15[0-9]{9})$/;
        if(!(length == 11 && mobile.test(loginUserName))){
            swal({   title: "请输入正确手机号",  type: "warning", timer: 1000,   showConfirmButton: true });
            return;
        }
        $.ajax({
            url: "/api/user/securityCode/"+$("#loginUserName").val(),
            type: "GET",
        }).done(function(data) {
            if (data.code=="00") {
                swal({   title: "短信验证码发送成功!",   text: "获取短信验证码成功，随机码有效期五分钟！",  type: "success", timer: 1000,   showConfirmButton: true });

            }else{
                swal("短信验证码发送失败!", data.msg, "error");
            };
        })
            .fail(function() {
                swal("短信验证码发送失败!", "短信验证码发送失败", "error");
            });

    });

    $('#resetBtn').click(function () {
        //console.info($("#loginform").serializeArray());
        $("#recoverform").validate({
            ignore: ".ignore",
            rules:{
                loginUserName:{
                    required:true,
                    isMobile:true
                },
                securityCode:{
                    required:true,
                    number:true
                },
                resetPassword:{
                    required:true
                }
            },
            errorClass: "help-inline",
            errorElement: "span",
            highlight:function(element, errorClass, validClass) {
                $(element).parents('.control-group').addClass('error');
            },
            unhighlight: function(element, errorClass, validClass) {
                $(element).parents('.control-group').removeClass('error');
                $(element).parents('.control-group').addClass('success');
            },
            submitHandler: function(form) {
                var params = {"userName":$("#loginUserName").val(),"securityCode":$("#securityCode").val(),"password":$("#resetPassword").val()};
                $.ajax({
                    url: "/api/user/resetPwd",
                    type: "POST",
                    data: params
                }).done(function(data) {
                    if (data.code=="00") {
                        //console.info(data);
                        swal({   title: "密码重置成功!",   text: "密码重置成功",  type: "success", timer: 1000,   showConfirmButton: true },function(){
                            setTimeout(function(){
                                window.location.href="login.html";
                            }, 500);
                        });

                    }else{
                        swal("密码重置成功!", data.msg, "error");
                    };
                }).fail(function() {
                    swal("密码重置成功!", "密码重置成功", "error");
                });
            }
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