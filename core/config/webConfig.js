/**
 * Created by pz on 16/1/27.
 */
var webConfig = {
    APP_PORT : 3001,
    WEB_URL : "http://120.25.102.158:3001/xljy/",
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
    IM_APPKEY: '23329639',
    IM_APPSECRET: '77ef7d1146dd5890bb381855fd598344',
    PUSH_CONFIG: {
        PUSH_ID: "ICwVedGLEOQG2jjwUkDSWnq8-gzGzoHsz",
        PUSH_KEY: "nwAGgKwMtvpOMJEGBgykfnqR"
    }

}
module.exports = webConfig;