//
//  PROTOTYPE FUNCTIONS
//

console.log('');

Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString();
    var dd = this.getDate().toString();
    return yyyy + '-' + (mm[1]?mm:'0'+mm[0]) + '-' + (dd[1]?dd:'0'+dd[0]);
};
Date.prototype.hhmmss = function() {
    var hh = this.getHours().toString();
    var mm = this.getMinutes().toString();
    var ss  = this.getSeconds().toString();
    return (hh[1]?hh:'0'+hh[0]) + ':' + (mm[1]?mm:'0'+mm[0]) + ':' + (ss[1]?ss:'0'+ss[0]);
};
String.prototype.log = function() {
    var msg = this;
    var date = new Date();
    console.log('LOG'.cyan + ' [ ' + date.yyyymmdd().gray + ' | '.gray + date.hhmmss().gray + ' ]\n' + msg + '\n');
};

function guid(len) {
    var arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return [].map.call(arr, function(n) { return n.toString(16); }).join("");
}

//
//  REQUIRE, SETTINGS AND VARIABLES
//

var body_parser = require('body-parser');
var json_db     = require('node-json-db');
var express     = require('express');
var colors      = require('colors');
var crypto      = require('crypto');
var bcrypt      = require('bcrypt-nodejs');
var util        = require('util');
var url         = require('url');
var fs          = require('fs');

var settings = {
    http: {
        port: process.env.PORT || 5000
    },
    app: {
        name: 'Shut app',
        salt_factor: 10
    }
};

// the express app for the server
var app = express();
// copy express app to standard http server
var server = require('http').Server(app);

// database users
var db_users = new json_db('data/users', true, true);
// database messages
var db_messages = new json_db('data/messages');
// database groups
var db_groups = new json_db('data/groups');

// body parser, parse incomming data to json
app.use(body_parser.json());
app.use(body_parser.urlencoded({
    extended: true
}));

//
//  FUNCTIONS
//

//
//  HTTP SERVER
//

app.get('/', function(req, res, next) {
    fs.readFile('index.html', 'utf8', function (error,data) {
        if(error){
            var error = new Error("Missing index.html file, but API is still useable");
            error.status = 404;
            error.error = "missing"
            next(error);
        }
        else{
            res.status(200).end(data);
        }
    });
});

app.post('/', function(req, res, next){
    res.status(200).end(JSON.stringify({
        http: 200,
        message: 'Find API help @ https://shut-app.herokuapp.com/'
    }));
});

app.post('/signup', function(req, res, next){

    var username = (req.body.username || "").toLowerCase();
    var password = (req.body.password || "").toLowerCase();

    if(username == '' || username == null || username.length > 16) {
        res.status(400).end(JSON.stringify({
            http: 400,
            error: 'username',
            message: 'Invalid username',
            username: username
        }));
    }
    else if(password == '' || password == null){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: 'password',
            message: 'Invalid password',
            username: username
        }));
    }
    else{

        try{
            db_users.getData('/' + username);
            res.status(400).end(JSON.stringify({
                http: 400,
                error: 'exists',
                message: 'Username already taken',
                username: username
            }));
        }
        catch(error){
            bcrypt.genSalt(settings.app.salt_factor, function(error, salt) {
                if(error){
                    return next(new Error("Error generating salt"));
                }
                bcrypt.hash(password, salt, null, function(error, hash){
                    if(error){
                        return next(new Error("Error generating hash"));
                    }

                    var session = crypto.randomBytes(20).toString('hex');

                    db_users.push('/' + username, {
                        username: username,
                        password: hash,
                        session: session,
                        created: Math.round(new Date() / 1000),
                        salt: salt,
                        id: ''
                    });
                    res.status(200).end(JSON.stringify({
                        http: 200,
                        username: username,
                        session: session,
                        id: '',
                        message: "Account created"
                    }));
                });
            });
        }

    }

});

app.post('/login', function(req, res, next){

    var username = (req.body.username || "").toLowerCase();
    var password = (req.body.password || "").toLowerCase();

    if(username == '' || username == null) {
        res.status(403).end(JSON.stringify({
            http: 403,
            error: 'username',
            message: 'Invalid username',
            username: username
        }));
    }
    else if(password == '' || password == null){
        res.status(403).end(JSON.stringify({
            http: 403,
            error: 'password',
            message: 'Invalid password',
            username: username
        }));
    }
    else{

        try{
            var user = db_users.getData('/' + username);

            bcrypt.compare(password, user.password, function(error, result) {
                if(error){
                    return next(new Error("Error comparing hashes"));
                }

                if(!result){
                    res.status(403).end(JSON.stringify({
                        http: 403,
                        error: 'login',
                        message: "Invalid password or username",
                        username: username
                    }));
                }
                else{
                    var session = crypto.randomBytes(20).toString('hex');
                    db_users.push('/' + username + '/session', session);

                    res.status(200).end(JSON.stringify({
                        http: 200,
                        username: username,
                        session: session,
                        id: user.id,
                        message: "Login successful"
                    }));
                }
            });

        }
        catch(error){
            res.status(403).end(JSON.stringify({
                http: 403,
                error: 'login',
                message: 'Invalid password or username',
                username: username
            }));
        }

    }

});

app.post('/read/dm/:username', function(req, res, next){

    var data = db_users.getData('/');

    for(var user in data){
        var id = data[user];
        console.log(user);
    }

});

// 404 page, if no match above
app.get('*', function(req, res, next){
    var error = new Error("Missing page");
    error.status = 404;
    error.error = "missing"
    next(error);
});

app.post('*', function(req, res, next){
    var error = new Error("Missing page");
    error.status = 404;
    error.error = "missing"
    next(error);
});

// 500 error page, if something happens internaly
app.use(function(error, req, res, next) {
    res.status(error.status || 500).end(JSON.stringify({
        error: error.error || 'internal',
        http: error.status || 500,
        stack: error.stack || null
    })); 
});

// start the server and listen on port setting
server.listen(settings.http.port, function(){
    ('running a server on port: ' + settings.http.port.toString().yellow).log();
});