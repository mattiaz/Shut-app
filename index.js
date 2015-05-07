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

var json_db = require('node-json-db');
var express = require('express');
var colors  = require('colors');
var bcrypt  = require('bcrypt-nodejs');
var util    = require('util');
var url     = require('url');
var fs      = require('fs');

var settings = {
    http: {
        port: process.env.PORT || 5000
    },
    app: {
        name: 'Shut app'
    }
};

console.log(bcrypt.hashSync("bacon"));
console.log(bcrypt.hashSync("bacon"));
console.log(bcrypt.hashSync("bacon"));

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

//
//  FUNCTIONS
//

//
//  HTTP SERVER
//

app.get('/', function(req, res) {
    fs.readFile('index.html', 'utf8', function (error,data) {
        if(error){
            res.status(404).end('Missing index.html file but API is still operational');
        }
        else{
            res.status(200).end(data);
        }
    });
});

app.post('/', function(req, res){
    res.status(200).end(JSON.stringify({
        http: 200,
        message: 'Find API help @ https://shut-app.herokuapp.com/'
    }));
});

app.post('/signup', function(req, res){

    var username = req.body.username.toLowerCase();
    var password = req.body.password.toLowerCase();

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



    }

});

// 404 page, if no match above
app.get('*', function(req, res){
    res.status(404).end(JSON.stringify({
        error: 'missing',
        http: 404
    }));
});

// 500 error page, if something happens internaly
app.use(function(error, req, res, next) {
    res.status(500).end(JSON.stringify({
        error: 'internal',
        stack: error.stack,
        http: 500
    }));
});

// start the server and listen on port setting
server.listen(settings.http.port, function(){
    ('running a server on port: ' + settings.http.port.toString().yellow).log();
});