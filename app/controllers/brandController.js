var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({

    add : function(req, res, next){
        var self = this;
        var brandName = req.body.brandName;
        var bUserId = req.body.bUserId;
        var brandDesc = req.body.brandDesc;
        var remark = req.body.remark;
        var oUserId = req.user.userId;
        if(!brandName){
            return next("品牌名称不能为空");
        }
        if(!bUserId){
            return next("集团园长编号不能为空");
        }
        self.model["brand"].save([brandName,bUserId,brandDesc,oUserId,remark], function(err, data){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                msg : "品牌添加成功"
            });
        });
    },

    modify : function(req, res, next){
        var self = this;
        var brandId = req.params.brandId;
        var brandName = req.body.brandName;
        var bUserId = req.body.bUserId;
        var brandUrl = req.body.brandUrl;
        var remark = req.body.remark;
        var oUserId = req.user.userId;
        if(!brandId || brandId <= 0){
            return next("品牌编号不能为空");
        }
        var obj = new Object();
        if(brandName){
            obj.brandName = brandName;
        }
        if(brandUrl){
            obj.brandUrl = brandUrl;
        }
        if(bUserId){
            obj.bUserId = bUserId;
        }
        if(remark){
            obj.remark = remark;
        }
        obj.doneDate = new Date();
        obj.oUserId = oUserId;
        self.model["brand"].update(obj, brandId, function(err, data){
            if(err){
                return next(err);
            }else if(data.affectedRows != 1){
                return next(new Error("品牌修改失败"));
            }
            res.json({
                code : "00",
                msg : "品牌修改成功"
            });
        });
    },

    del : function(req, res, next){
        var self = this;
        var brandId = req.params.brandId;
        self.model['school'].countSchoolByBrandId(brandId, function(err, schools){
            if(err){
                return next(err);
            }
            if(schools && schools.total > 0){
                return next(new Error("该品牌已关联学校，不允许删除"));
            }
            self.model['brand'].del(brandId, function(err, data){
                if(err){
                    return next(err);
                }else if(data.affectedRows != 1){
                    return next(new Error("需删除的品牌信息不存在"));
                }
                res.json({
                    code : "00",
                    msg : "品牌删除成功"
                });
            });
        });
    },

    show : function(req, res, next){
        var self = this;
        var brandId = req.params.brandId;
        self.model['brand'].findByBrandId(brandId, function(err, brand){
            if(err){
                return next(err);
            }
            res.json({
                code : "00",
                data : brand
            });
        });
    },

    list : function(req, res, next){
        var self = this;
        var start = parseInt(req.query.iDisplayStart || this.webConfig.iDisplayStart);
        var pageSize = parseInt(req.query.iDisplayLength || this.webConfig.iDisplayLength);
        var obj = new Object;
        var brandName = req.query.brandName;
        if(brandName){
            obj.brandName = brandName;
        }
        var bUserId = req.query.bUserId;
        if(bUserId){
            obj.bUserId = parseInt(bUserId);
        }
        self.model['brand'].listByPage(obj, start, pageSize, function(err, total, schools){
            if(err){
                return next(err);
            }
            res.json(self.createPageData("00", total, schools));
        });
    }

});