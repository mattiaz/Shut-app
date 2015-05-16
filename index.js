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

//
//  REQUIRE, SETTINGS AND VARIABLES
//

var body_parser = require('body-parser');
var requests    = require('./requests.js');
var json_db     = require('node-json-db');
var express     = require('express');
var colors      = require('colors');
var crypto      = require('crypto');
var bcrypt      = require('bcrypt-nodejs');
var util        = require('./util.js');
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

var loadDB = true;

// the express app for the server
var app = express();
// copy express app to standard http server
var server = require('http').Server(app);

// database users
var db_users = new json_db('data/users', true, true);

// database messages
var db_messages = new json_db('data/messages', true, true);

// database groups
var db_groups = new json_db('data/groups', true, true);

// import data to util
util.importUsers(db_users);

// body parser, parse incomming data to json
app.use(body_parser.json());
app.use(body_parser.urlencoded({
    extended: true
}));

//
//  HTTP SERVER
//

requests(app);

app.use(function(res, req, next){
    if(loadDB){
        db_users.getData('/');
        db_messages.getData('/');
        db_groups.getData('/');
        console.log('');
        loadDB = false;
    }
    next();
});

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