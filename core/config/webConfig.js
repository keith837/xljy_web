/**
 * Created by pz on 16/1/27.
 */
var webConfig = {
    STATICPATH: [
        {
            webpath: "/xljy",
            filepath: "static/htmls",
            option: {}
        },
        {
            webpath: "/xljy/static/photos",
            filepath: "static/photos",
            option: {}
        }],
    contextPath: "/xljy",
    PRINT_ACCESS_LOG: false,
    iDisplayLength: 10,
    iDisplayStart: 0,
    iDisplayPhotoLength: 9,
    iDisplayCommentLength: 6,
    VIEWSPATH: 'app/views'
}
module.exports = webConfig;