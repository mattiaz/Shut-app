//
//  HELPER FUNCTIONS
//

function _info(msg){
    var date = new Date();
    console.log('INFO'.cyan + ' [ ' + date.yyyymmdd().gray + ' | '.gray + date.hhmmss().gray + ' ]\n' + msg + '\n');
}
function _warning(msg){
    var date = new Date();
    console.log('WARNING'.yellow + ' [ ' + date.yyyymmdd().gray + ' | '.gray + date.hhmmss().gray + ' ]\n' + msg + '\n');
}
function _danger(msg){
    var date = new Date();
    console.log('DANGER'.red + ' [ ' + date.yyyymmdd().gray + ' | '.gray + date.hhmmss().gray + ' ]\n' + msg + '\n');
}
function _system(msg){
    var date = new Date();
    console.log('SYSTEM'.yellow + ' [ ' + date.yyyymmdd().gray + ' | '.gray + date.hhmmss().gray + ' ]\n' + msg + '\n');
}

//
//  EXPORTS
//

var db_users;

module.exports = {

    importUsers: function(users){
        db_users = users;
        _system('Importing users');
    },

    getLastId: function (){
        var data = db_users.getData('/');
        var id = null;
        for(var user in data){
            user = data[user];
            id = user.id;
        }
        return id;
    },

    getUserById: function(id){
        var data = db_users.getData('/');
        for(var user in data){
            user = data[user];
            if(user.id == id)
                return user.username;
        }
        return null;
    },

    getUserBySession: function(session){
        var data = db_users.getData('/');
        for(var user in data){
            user = data[user];
            if(user.session == session)
                return user.username;
        }
        return null;
    },

    sessionExpired: function(user){
        
        var user = db_users.getData('/' + user);
        var now = Math.round(new Date() / 1000);
        var old = user.session_age;

        if(now - old > 60*60*24*30)
            return true;
        else
            return false;

    }

}