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
Array.prototype.removeByValue = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
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
var db_users = new json_db('data/users', true, false);

// database messages
var db_messages = new json_db('data/messages', true, false);

// database groups
var db_groups = new json_db('data/groups', true, false);

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

app.use(function(res, req, next){
    if(loadDB){
        db_users.getData('/');
        db_messages.getData('/');
        db_groups.getData('/');
        console.log('');
        loadDB = false;
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

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

app.post('/signup', function(req, res, next){

    var username = (req.body.username || "").toLowerCase();
    var password = (req.body.password || "").toLowerCase();

    var forbidden = ["null", "0", "username", "user", "password", "id"];

    if(username == '' || username == null || username.length > 16 || forbidden.indexOf(username) > -1) {
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

                    var timestamp = Math.round(new Date() / 1000);
                    var session = crypto.createHash('md5').update('session' + timestamp.toString()).digest('hex');
                    
                    var id = util.getLastId() + 1 || 1;
                    // var id = crypto.createHash('md5').update(timestamp.toString()).digest('hex');

                    db_users.push('/' + username, {
                        id: id,
                        created: timestamp,
                        username: username,
                        password: hash,
                        salt: salt,
                        session: session,
                        session_age: timestamp
                    });
                    res.status(200).end(JSON.stringify({
                        http: 200,
                        username: username,
                        session: session,
                        id: id,
                        message: "Account created"
                    }));
                });
            });
        }

    }

});

app.post('/signin', function(req, res, next){

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
                    
                    var timestamp = Math.round(new Date() / 1000);
                    var session = crypto.createHash('md5').update('session' + timestamp.toString()).digest('hex');

                    db_users.push('/' + username + '/session', session);
                    db_users.push('/' + username + '/session_age', timestamp);

                    res.status(200).end(JSON.stringify({
                        http: 200,
                        username: username,
                        session: session,
                        id: user.id,
                        message: "Sign in successful"
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

app.get('/user/id/:id', function(req, res, next){
    var username = util.getUserById(req.params.id);
    if(username == null){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            id: req.params.id,
            message: "No user with this id"
        }));
    }
    try{
        var data = db_users.getData('/' + username);
    }
    catch(error){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            id: req.params.id,
            message: "No user with this id"
        }));
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        id: data.id,
        username: data.username,
        created: data.created 
    }));

});

app.get('/user/search/', function(req, res, next){

    var data = db_users.getData('/');
    var users = [];

    for(user in data){
        users.push(user);
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        search: "",
        results: users
    }));

});

app.get('/user/search/:username', function(req, res, next){

    var data = db_users.getData('/');
    var username = req.params.username.toLowerCase();
    var users = [];

    for(user in data){
        if(user.indexOf(username) > -1)
            users.push(user);
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        search: username,
        results: users
    }));

});

app.get('/user/:username', function(req, res, next){
    try{
        var data = db_users.getData('/' + req.params.username);
    }
    catch(error){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            username: req.params.username,
            message: "No user with this username"
        }));
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        id: data.id,
        username: data.username,
        created: data.created
    }));
});

app.get('/session', function(req, res, next){

    try{
        var session = (req.query.session || "").toLowerCase();
        var username = util.getUserBySession(session);

        var data = db_users.getData('/' + username);
        var expired = util.sessionExpired(username);

        res.status(200).end(JSON.stringify({
            http: 200,
            id: data.id,
            username: data.username,
            created: data.created,
            session_age: data.session_age,
            expired: expired,
            session: session
        }));
    }
    catch(error){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "session",
            session: session,
            message: "No user with this session"
        }));
    }

});

app.get('/dm/:id', function(req, res, next){

    try{
        var session = (req.query.session || "").toLowerCase();
        var receiver = util.getUserBySession(session);
            receiver = db_users.getData('/' + receiver);
        var expired = util.sessionExpired(receiver.username);
    }
    catch(error){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "session",
            session: session,
            message: "No user with this session"
        }));
        return;
    }

    if(expired){
        res.status(403).end(JSON.stringify({
            http: 403,
            error: "session",
            id: receiver.id,
            username: receiver.username,
            created: receiver.created,
            session_age: receiver.session_age,
            expired: expired,
            session: session,
            message: "Your session has expired."
        }));
        return;
    }

    var sender = util.getUserById(req.params.id);

    if(sender == null){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            id: req.params.id,
            message: "No user with this id"
        }));
        return;
    }
    else{
        sender = db_users.getData('/' + sender);
    }

    var messages = db_messages.getData('/');
    var result = {};

    for(timestamp in messages){
        var message = messages[timestamp];

        if(message.from == sender.id && message.to == receiver.id || message.from == receiver.id && message.to == sender.id)
            result[timestamp] = messages[timestamp];
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        message: "Reading all messages with this user",
        from: sender.id,
        to: receiver.id,
        data: result
    }));

});

app.get('/dm/:id/:timestamp', function(req, res, next){

    try{
        var session = (req.query.session || "").toLowerCase();
        var receiver = util.getUserBySession(session);
            receiver = db_users.getData('/' + receiver);
        var expired = util.sessionExpired(receiver.username);
    }
    catch(error){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "session",
            session: session,
            message: "No user with this session"
        }));
        return;
    }

    if(expired){
        res.status(403).end(JSON.stringify({
            http: 403,
            error: "session",
            id: receiver.id,
            username: receiver.username,
            created: receiver.created,
            session_age: receiver.session_age,
            expired: expired,
            session: session,
            message: "Your session has expired."
        }));
        return;
    }

    var sender = util.getUserById(req.params.id);
    var time = req.params.timestamp;

    if(sender == null){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            id: req.params.id,
            message: "No user with this id"
        }));
        return;
    }
    else{
        sender = db_users.getData('/' + sender);
    }

    var messages = db_messages.getData('/');
    var result = {};

    for(timestamp in messages){
        var message = messages[timestamp];

        if(message.timestamp >= time)
            if(message.from == sender.id && message.to == receiver.id || message.from == receiver.id && message.to == sender.id)
                result[timestamp] = messages[timestamp];
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        message: "Reading all messages with this user",
        timestamp: time,
        from: sender.id,
        to: receiver.id,
        data: result
    }));

});

app.post('/dm/:id', function(req, res, next){

    try{
        var session = (req.body.session || "").toLowerCase();
        var sender = util.getUserBySession(session);
            sender = db_users.getData('/' + sender);
        var expired = util.sessionExpired(sender.username);
    }
    catch(error){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "session",
            session: session,
            message: "No user with this session"
        }));
        return;
    }

    if(expired){
        res.status(403).end(JSON.stringify({
            http: 403,
            error: "session",
            id: sender.id,
            username: sender.username,
            created: sender.created,
            session_age: sender.session_age,
            expired: expired,
            session: session,
            message: "Your session has expired."
        }));
        return;
    }

    var receiver = util.getUserById(req.params.id);

    if(receiver == null){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            id: req.params.id,
            message: "No user with this id"
        }));
        return;
    }
    else{
        receiver = db_users.getData('/' + receiver);
    }

    var timestamp = Math.round(new Date() / 1000);
    var id = crypto.createHash('md5').update(timestamp.toString()).digest('hex');
    var data = req.body.data || "";
    var content = req.body.content_type || "";

    if(data == "" || content != "emote" && content != "text"){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "data",
            from: sender.id,
            to: receiver.id,
            content_type: content,
            data: data,
            message: "Missing data in request"
        }));
        return;
    }
    else{
        db_messages.push('/' + timestamp, {
            id: id,
            timestamp: timestamp,
            type: 'dm',
            content_type: content,
            data: data,
            from: sender.id,
            to: receiver.id
        });
        res.status(200).end(JSON.stringify({
            http: 200,
            from: sender.id,
            to: receiver.id,
            id: id,
            timestamp: timestamp,
            content_type: content,
            type: 'dm',
            message: "Message sent"
        }));
        return;
    }


});

app.get('/friends', function(req, res, next){

    try{
        var session = (req.query.session || "").toLowerCase();
        var contact = util.getUserBySession(session);
            contact = db_users.getData('/' + contact);
        var expired = util.sessionExpired(contact.username);
    }
    catch(error){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "session",
            session: session,
            message: "No user with this session"
        }));
        return;
    }

    if(expired){
        res.status(403).end(JSON.stringify({
            http: 403,
            error: "session",
            id: contact.id,
            username: contact.username,
            created: contact.created,
            session_age: contact.session_age,
            expired: expired,
            session: session,
            message: "Your session has expired."
        }));
        return;
    }

    var friends;
    try{
        friends = db_groups.getData('/' + contact.username);
    }
    catch(error){
        friends = [];
    }

    var temp = [];
    for(var i = 0; i < friends.length; i++){
        try{
            var id = friends[i];
            var username = util.getUserById(id);
            temp.push({id: id, username: username});
        }
        catch(error){

        }
    }
    friends = temp;

    res.status(200).end(JSON.stringify({
        http: 200,
        user: contact.id,
        friends: friends,
        message: "Friends listed"
    }));

});

app.post('/friends/add/:id', function(req, res, next){
    try{
        var session = (req.body.session || "").toLowerCase();
        var contact = util.getUserBySession(session);
            contact = db_users.getData('/' + contact);
        var expired = util.sessionExpired(contact.username);
    }
    catch(error){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "session",
            session: session,
            message: "No user with this session"
        }));
        return;
    }

    if(expired){
        res.status(403).end(JSON.stringify({
            http: 403,
            error: "session",
            id: contact.id,
            username: contact.username,
            created: contact.created,
            session_age: contact.session_age,
            expired: expired,
            session: session,
            message: "Your session has expired."
        }));
        return;
    }

    var friend = util.getUserById(req.params.id);

    if(friend == null){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            id: req.params.id,
            message: "No user with this id"
        }));
        return;
    }
    else{
        friend = db_users.getData('/' + friend);
    }

    try{
        var friends = db_groups.getData('/' + contact.username);
        if(friends.indexOf(friend.id) == -1)
            friends.push(friend.id);
        db_groups.push('/' + contact.username, friends);
    }
    catch(error){
        db_groups.push('/' + contact.username, [friend.id]);
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        user: contact.id,
        friend: friend.id,
        message: "Friend added"
    }));

});

app.post('/friends/remove/:id', function(req, res, next){
    try{
        var session = (req.body.session || "").toLowerCase();
        var contact = util.getUserBySession(session);
            contact = db_users.getData('/' + contact);
        var expired = util.sessionExpired(contact.username);
    }
    catch(error){
        res.status(400).end(JSON.stringify({
            http: 400,
            error: "session",
            session: session,
            message: "No user with this session"
        }));
        return;
    }

    if(expired){
        res.status(403).end(JSON.stringify({
            http: 403,
            error: "session",
            id: contact.id,
            username: contact.username,
            created: contact.created,
            session_age: contact.session_age,
            expired: expired,
            session: session,
            message: "Your session has expired."
        }));
        return;
    }

    var friend = util.getUserById(req.params.id);

    if(friend == null){
        res.status(404).end(JSON.stringify({
            http: 404,
            error: "username",
            id: req.params.id,
            message: "No user with this id"
        }));
        return;
    }
    else{
        friend = db_users.getData('/' + friend);
    }

    try{
        var friends = db_groups.getData('/' + contact.username);
        friends.removeByValue(friend.id);
        db_groups.push('/' + contact.username, friends);
    }
    catch(error){
        
    }

    res.status(200).end(JSON.stringify({
        http: 200,
        user: contact.id,
        friend: friend.id,
        message: "Friend removed"
    }));


});

app.post('/export/users', function(req, res, next){
    var password = (req.body.password || "");
    if(password == "#-9xCa4^598^'2R+Qx75sB6S/n6)&8nT"){
        res.end(JSON.stringify(db_users.getData('/')));
    }
    else
        next();
});

app.post('/export/messages', function(req, res, next){
    var password = (req.body.password || "");
    if(password == "#-9xCa4^598^'2R+Qx75sB6S/n6)&8nT"){
        res.end(JSON.stringify(db_messages.getData('/')));
    }
    else
        next();
});

app.post('/export/friends', function(req, res, next){
    var password = (req.body.password || "");
    if(password == "#-9xCa4^598^'2R+Qx75sB6S/n6)&8nT"){
        res.end(JSON.stringify(db_groups.getData('/')));
    }
    else
        next();
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
        http: error.status || 500/*,
        stack: error.stack || null*/
    })); 
});

// start the server and listen on port setting
server.listen(settings.http.port, function(){
    ('running a server on port: ' + settings.http.port.toString().yellow).log();
});