//
//  PROTOTYPE FUNCTIONS
//

console.log('');

Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString();
    var dd = this.getDate().toString();
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};
Date.prototype.hhmmss = function() {
    var hh = this.getHours().toString();
    var mm = this.getMinutes().toString();
    var ss  = this.getSeconds().toString();
    return (hh[1]?hh:"0"+hh[0]) + ':' + (mm[1]?mm:"0"+mm[0]) + ':' + (ss[1]?ss:"0"+ss[0]);
};
String.prototype.log = function() {
    var msg = this;
    var date = new Date();
    console.log('LOG'.cyan + ' [ ' + date.yyyymmdd().gray + ' | '.gray + date.hhmmss().gray + ' ]\n' + msg + '\n');
};

//
//  REQUIRE, SETTINGS AND VARIABLES
//

var json_db       = require('node-json-db');
var express       = require('express');
var colors        = require('colors');
var crypto        = require('crypto');
var util          = require('util');
var url           = require('url');

var settings = {
    http: {
        port: 1337
    },
    app: {
        name: 'Shut app'
    }
};

// the express app for the server
var app = express();
// copy express app to standard http server
var server = require('http').Server(app);

//
//  HTTP SERVER
//

app.get('/', function(req, res){
    res.status(404).end(JSON.stringify({
        
    }));
});

// 404 page, if no match above
app.get('*', function(req, res){
    res.status(404).end(JSON.stringify({
        error: 404
    }));
});

// 500 error page, if something happens internaly
app.use(function(error, req, res, next) {
    res.status(500).end(JSON.stringify({
        error: 500
    }));
});

// start the server and listen on port setting
server.listen(settings.http.port, function(){
    ("running a server on port: " + settings.http.port.toString().yellow).log();
});