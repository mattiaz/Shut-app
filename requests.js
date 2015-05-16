module.exports = function(app){
    
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

app.get('/session/:session', function(req, res, next){

    try{
        var session = (req.params.session || "").toLowerCase();
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

    return next();

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
    
}