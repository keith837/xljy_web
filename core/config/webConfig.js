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
        },
        {
            webpath: "/xljy/static/download",
            filepath: "static/download",
            option: {}
        },
        {
            webpath: "/xljy/static/upload",
            filepath: "static/upload",
            option: {}
        }],
    contextPath: "/xljy",
    PRINT_ACCESS_LOG: false,
    iDisplayLength: 10,
    iDisplayStart: 0,
    iDisplayPhotoLength: 9,
    iDisplayCommentLength: 6,
    VIEWSPATH: 'app/views',
    IM_APPKEY: '23311805',
    IM_APPSECRET: '659744536d30b755129311932aab92d7',
    PUSH_CONFIG: {
        PUSH_ID: "iGUAhRUsALJCmhg6qtrvagRb-gzGzoHsz",
        PUSH_KEY: "JDU4Ezny3IVmQPPh7TNs80Cg"
    }

}
module.exports = webConfig;