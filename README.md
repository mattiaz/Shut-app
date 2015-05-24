#Shut app
A simple chat API for node.js with signup, signin, direct messages, friends, search and sessions.
All data is stored in json format and is accessible with a REST api.

A live server is running at [http://shut-app.herokuapp.com](http://shut-app.herokuapp.com).

<h1>Shut app - API</h1>
<h2>Postman</h2>
<p>An excellent tool to test the Shut app API with.<br><a href="https://chrome.google.com/webstore/detail/postman-rest-client/fdmmgilgnpjigdojojpjoooidkmcomcm">https://chrome.google.com/webstore/detail/postman-rest-client/fdmmgilgnpjigdojojpjoooidkmcomcm</a></p>
<h2>Error messages</h2>
<pre>
{"http": "&lt;code&gt;"}

200 - everything ok
400 - bad request
403 - forbidden
404 - missing page
500 - internal server error</pre>
<pre>
{"error": "&lt;code&gt;"}

username - Invalid username
password - Invalid password
session  - Invalid session, expired or missing
missing  - Missing page
login    - Invalid username or password
data     - missing data in request
internal - Internal server error
exists   - Username already exists
</pre>
<h2>Session errors</h2>
<p>Some request can cause session errors, here are two examples.</p>
<pre>
{
    "http":     400,
    "error":    "session",
    "session":  "0081542111a77c103d3c7424ebe06b5e",
    "message":  "No user with this session"
}

{
    "http":         403,
    "error":        "session",
    "id":           1,
    "username":     "admin",
    "created":      1431776234,
    "session_age":  1431776435,
    "expired":      true,
    "session":      "0081542111a77c103d3c7424ebe06b5e",
    "message":      "Your session has expired."
}
</pre>

<h2>Messages</h2>
<p>There is two types of messages, <code>content_type:</code> <code>text</code> or <code>emote</code>. Text just means plain text, but emote will be rendered in a special way. It's possible to send any emote but it's good to have a list too choose from, so all clients talking to the API can render the same emote.</p>
        
<h2>Sign up</h2>
<p>Sign up a new user with username and password and sign in, this will generate a session token.<br>POST to <a href="/signup">/signup</a>. GET will not work.</p>
<pre>
POST /signup

POST data:
username
password

Responses:

{
    "http":     200,
    "username": "arthur.dent",
    "session":  "0635a0cb392bec66be613e239d5a8c9a",
    "id":       42,
    "message":  "Account created"
}

{
    "http":     400,
    "error":    "exists",
    "message":  "Username already taken",
    "username": "arthur.dent"
}
</pre>

<h2>Sign in</h2>
<p>Sign in a user with username and password, this will generate a session token.<br>POST to <a href="/signin">/signin</a>. GET will not work. Session will be active for 7 days.</p>
<pre>
POST /signin

POST data:
username
password

Responses:

{
    "http":     200,
    "username": "arthur.dent",
    "session":  "82a0767b1a024fe08f53ea44dd0810e3", 
    "id":       42,
    "message":  "Sign in successful"
}

{
    "http":     403,
    "error":    "login",
    "message":  "Invalid password or username",
    "username": "arthur.dent"
}
</pre>

<h2>Find user</h2>
<h3>Find user by username</h3>
<p>Find a user by username, returns id and when the account was created.<br>GET from <a href="/user/admin">/user/id/:username</a>. POST will not work.</p>
<pre>
GET /user/:username

Responses:

{
    "http":     200,
    "id":       42,
    "username": "arthur.dent",
    "created":  1429142400
}

{
    "http":     404,
    "error":    "username",
    "username": "ellen.ripley",
    "message":  "No user with this username"
}
</pre>

<h3>Find user by id</h3>
<p>Find a user by id, returns username and when the account was created.<br>GET from <a href="/user/id/0">/user/id/:id</a>. POST will not work.</p>
<pre>
GET /user/id/:id

Responses:

{
    "http":         200,
    "id":           42,
    "username":     "arthur.dent",
    "created":      1429142400
}

{
    "http":         404,
    "error":        "username",
    "id":           "1337",
    "message":      "No user with this id"
}
</pre>

<h3>Find user by session</h3>
<p>Find a user by session, returns username if the session is expired.<br>GET from <a href="/session?session=a56b332a73541331b39f05adc85399fa">/session?session=:session</a>. POST will not work.</p>
<pre>
GET /session

Get data (?param=&lt;data&gt;):
session

Responses:

{
    "http":         200,
    "id":           42,
    "username":     "arthur.dent",
    "created":      1431726342,
    "session_age":  1429143400,
    "expired":      true,
    "session":      "82a0767b1a024fe08f53ea44dd0810e3"
}

{
    "http":         400,
    "error":        "session",
    "session":      "0635a0cb392bec66be613e239d5a8c9a",
    "message":      "No user with this session"
}
</pre>

<h3>Search user</h3>
<p>Search from all users, returns an array of all matching usernames.<br>GET from <a href="/user/search/admin">/user/search/:username</a>. POST will not work.</p>
<pre>
GET /user/search/:username

Responses:

{
    "http": 200,
    "search": "fro",
    "results": [
        "frodo.bagger",
        "kermit.frog"
    ]
}

{
    "http": 200,
    "search": "",
    "results": [
        "admin",
        "arthur.dent",
        "ellen.ripley",
        "frodo.bagger",
        "kermit.frog",
        ...
    ]
}
</pre>

<h2>Post message</h2>
<h3>Post DM (direct message)</h3>
<p>Post a message directly to a user, choose by sending a emote or a text message.<br>POST to <a href="/dm/1">/dm/:id</a>. GET will not work.</p>
<pre>
POST /dm/:id

Post data:
session
content_type (text / emote)
data (the actual message content)

Responses:

{
    "http":         200,
    "from":         23,
    "to":           47,
    "id":           "3389ce932b2e0a7aea7376ab9f8539b2",
    "timestamp":    1431776686,
    "content_type": "text",
    "type":         "dm",
    "message":      "Message sent"
}

{
    "http":         400,
    "error":        "data",
    "from":         23,
    "to":           47,
    "content_type": "",
    "data":         "My mom always says life is like a box of chocolate.",
    "message":      "Missing data in request"
}

{
    "http":         404,
    "error":        "username",
    "id":           "1337",
    "message":      "No user with this id"
}
</pre>

<h2>Read messages</h2>
<h3>Read DM (direct message)</h3>
<p>Read all messages from a user or just the latest messages after a certain timestamp.<br>GET from <a href="/dm/1?session=3389ce932b2e0a7aea7376ab9f8539b2">/dm/:id?session=:session</a>. POST will not work.<br>GET from <a href="/dm/1/1432465821?session=3389ce932b2e0a7aea7376ab9f8539b2">/dm/:id/:timestamp?session=:session</a>. POST will not work.</p>
<pre>
GET /dm/:id
or
GET /dm/:id/:timestamp

Get data (?param=&lt;data&gt;):
session

Responses:

{
    "http": 200,
    "message": "Reading all messages from this user",
    "from": 1,
    "to": 2,
    "data": {
        "1432465821": {
            "id": "322e1bedc5b818f8a827e0ba9c7c62a9",
            "timestamp": 1432465821,
            "type": "dm",
            "content_type": "text",
            "data": "Hello World",
            "from": 2,
            "to": 1
        },
        "1432466147": {
            "id": "1bfefe5959671eade15dc0545e72b4ee",
            "timestamp": 1432466147,
            "type": "dm",
            "content_type": "text",
            "data": "Hi!",
            "from": 1,
            "to": 2
        }
    }
}

{
    "http":         404,
    "error":        "username",
    "id":           "1337",
    "message":      "No user with this id"
}
</pre>

<h2>Friends</h2>
<p>Friends are a easy way to save contacts, just add a user to your list and the clients can load pre load all contacts from this list.</p>
<h3>Get friends</h3>
<p>Get all user id:s for your friends.<br>GET from <a href="/friends?session=3389ce932b2e0a7aea7376ab9f8539b2">/friends?session=:session</a>. POST will not work.</p>
<pre>
GET /friends

Get data (?param=&lt;data&gt;):
session

Responses:

{
    "http": 200,
    "user": 1,
    "friends": [
        2,
        4,
        9
    ],
    "message": "Friends listed"
}
</pre>

<h3>Add friend</h3>
<p>Add a contact to your list.<br>POST to <a href="/friends/add/1337">/friends/add/:id</a>. GET will not work.</p>
<pre>
POST /friends/add/:id

Post data:
session

Responses:

{
    "http": 200,
    "user": 1,
    "friend": 2,
    "message": "Friend added"
}
</pre>

<h3>Remove friend</h3>
<p>Remove a contact from your list.<br>POST to <a href="/friends/remove/1337">/friends/remove/:id</a>. GET will not work.</p>
<pre>
POST /friends/remove/:id

Post data:
session

Responses:

{
    "http": 200,
    "user": 1,
    "friend": 2,
    "message": "Friend removed"
}
</pre>

#License

Copyright (c) 2015 Mattias Ajander.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
