var express = require('express');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoose = require('./config/mongoose_conn.js');
//var fs = require('fs');
var bodyParser = require('body-parser');
var session = require('express-session');
var sessionOption = require('./config/sessionOption');
//var path = __dirname + '/views';


// passport serialize / deserialize 설정..
require('./config/passport')(passport);

var app = express();

//statics
app.use(express.static(__dirname + '/public'));

// session
app.use(session(sessionOption));

// body parser
app.use(bodyParser.urlencoded({extended: false}));

// passport
app.use(passport.initialize());
app.use(passport.session());

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(require('./routers/web_router.js'));

var auth = require('./config/middlewares/authorization');
var commonAuth = [auth.requiresLogin];
require('./routers/TheRest.js')(app, passport);

app.use('/posts',  commonAuth, require('./routers/Posts.js'));
app.use('/workPosts',  commonAuth, require('./routers/WorkPosts'));
app.use('/showPosts',commonAuth, require('./routers/ShowPosts'));
app.use('/postComments', commonAuth, require('./routers/PostComments'));
app.use('/artistBlogs', commonAuth, require('./routers/ArtistBlogs'));
app.use('/spaceBlogs',commonAuth, require('./routers/SpaceBlogs'));
app.use('/blogs', commonAuth, require('./routers/Blogs'));
app.use('/users', require('./routers/Users'));
app.use('/search', commonAuth, require('./routers/Search'));
app.use('/notis', require('./routers/Notis'));


/**
 * error catch
 */
app.use(function (err, req, res, next) {
    //console.error(err.message);
    console.log(req.method);
    console.log(req.url);
    var msg = {
        code: err.code,
        msg: err.message
    };
    console.error('err', err);
    res.status(err.code).json(msg);
});

var port1 = 80;
var port2 = 443;

// For HTTP
app.listen(port1, function () {
    console.log('Http Server @ '+port1);
});

// For HTTPS
var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync('./config/encryption/key.pem'),
    cert: fs.readFileSync('./config/encryption/cert.pem')
};

var secureServer = https.createServer(options, app);
secureServer.listen(port2,function(){
    console.log('Https Server @ '+port2);
});