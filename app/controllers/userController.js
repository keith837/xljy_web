/**
 * Created by pz on 16/1/27.
 */

//querystring = require("querystring"),
var formidable = require("formidable");
var basicController = require("../../core/utils/controller/basicController");
module.exports = new basicController(__filename).init({
    userShow: function (request, response) {
        console.log("Hello world！！");
        //this.db.queryOne("SELECT * FROM ?? WHERE ? = ?", ["user", "1", "1"], function (err, res) {
        //    console.log(request.query);
        //    response.json(res);
        //})
        var body = '<html>' +
            '<head>' +
            '<meta http-equiv="Content-Type" content="text/html; ' +
            'charset=UTF-8" />' +
            '</head>' +
            '<body>' +
            '<form action="/uploads" enctype="multipart/form-data" ' +
            'method="post">' +
            '<input type="text" name="a1" value="123213">' +
            '<input type="file" name="upload2" multiple="multiple">' +
            '<input type="file" name="uploads" multiple="multiple">' +
            '<input type="submit" value="Upload file" />' +
            '</form>' +
            '</body>' +
            '</html>';
        response.send(body);
    },
    upload: function (request, response) {
        var self = this;
        var form = new formidable.IncomingForm();
        form.uploadDir = this.uploadPath;
        form.parse(request, function (error, fields, files) {
            //console.log(this);
            var info = self.fileUtils.saveFormUploadsWithAutoName(files, __dirname + "/../../static/uploads/images/full/");
            console.log(info);
            response.json(info);
            //fs.renameSync(files.upload.path, __dirname+"/../cache/uploads/"+"test.png");
            //response.writeHead(200, {"Content-Type": "text/html"});
            //response.write("received image:<br/>");
            //response.write("<img src='/show' />");
            response.end();
        });
    },
    show: function (request, response) {
        console.log("Request handler 'show' was called.");
        fs.readFile(__dirname + "/../cache/uploads/" + "test.png", "binary", function (error, file) {
            if (error) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(error + "\n");
                response.end();
            } else {
                response.writeHead(200, {"Content-Type": "image/png"});
                response.write(file, "binary");
                response.end();
            }
        });
    }


});
