// All Module Imports
var _ = require('underscore'),
    http = require('http'),
    express = require('express'),
    jade = require('jade'),
    fs = require('fs'),
    xmlstream = require('xml-stream'),
    easyrtc = require('easyrtc'),
    app = module.exports.app = express(),
    rtcApp = module.exports.app = express(),
    server = http.createServer(app),
    rtcServer = http.createServer(rtcApp);

// Set up server file structure
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.render('home.jade');
});

// Import words for room name generation
var words = new xmlstream(fs.createReadStream('xml/words.xml')),
    rooms = [],
    roomsWithUsers = {};
var adjectives = [],
    colors = [],
    nouns = [];
// Extract only words from the xml document
words.on('text: adjectives > word', function (item) {
    adjectives.push(item['$text']);
});
words.on('text: colors > word', function (item) {
    colors.push(item['$text']);
});
words.on('text: nouns > word', function (item) {
    nouns.push(item['$text']);
});

// Set up socket.io server
var socketio = require('socket.io'),
    io = socketio.listen(server),
    rtcIO = socketio.listen(rtcServer);


// Server to client communication functions


/**
 * Message expectations are defined by their prefixes.
 * These prefixes are:
 *      universal - Transmit data to all clients, expect no response.
 *      broadcast - Transmit data to all clients in a given room, expect no response.
 */

/**
 * Send a message to all sockets in a given room.
 * @socket {socket} The socket sending the message.
 * @message {string} The message being sent.
 */
function broadcastMessage(socket, message) {
    var data = {'message': message,
                'id': socket.id,
                'nickname': socket.nickname};
    socket.broadcast.to(socket.roomname).emit('broadcastMessage', data);
}

/**
 * Send a notificiation to all sockets in a given room.
 * @socket {socket} The socket about which the notification is about.
 * @notification {string} The notification being snet.
 */
function broadcastNotification(socket, notification) {
    var data = {'notification': notification};
    socket.broadcast.to(socket.roomname).emit('broadcastNotification', data);
}

/**
 * Notify all sockets in a given room that a user has joined the room.
 * @socket {socket} The socket of the user that has joined the room.
 */
function broadcastUserJoined(socket) {
    roomsWithUsers[socket.roomname].push([socket.id, socket.nickname]);
    var data = {'nickname': socket.nickname,
                'id': socket.id};
    socket.broadcast.to(socket.roomname).emit('broadcastUserJoined', data);
}

/**
 * Notify all sockets in a given room that a user has disconnected.
 * @socket {socket} The socket of the use that has disconnected.
 */
function broadcastUserDisconnected(socket) {
    roomsWithUsers[socket.roomname] = _.reject(roomsWithUsers[socket.roomname], function (item) {
        return (item[0] === socket.id && item[1] === socket.nickname);
    });
    var data = {'nickname': socket.nickname,
                'id': socket.id};
    socket.broadcast.to(socket.roomname).emit('broadcastUserDisconnected', data);
}

 /**
  * Notify all sockets in a given room that a user has left the room.
  * @socket {socket} the socket of the user that has left the room.
  */
function broadcastUserLeft(socket) {
    roomsWithUsers[socket.roomname] = _.reject(roomsWithUsers[socket.roomname], function (item) {
        return (item[0] === socket.id && item[1] === socket.nickname);
    });
    var data = {'nickname': socket.nickname,
                'id': socket.id};
    socket.broadcast.to(socket.roomname).emit('broadcastUserLeft', data);
}


// Client to server communication messages
io.sockets.on('connection', function (socket) {

    /**
     * Server has been asked to broadcast a message to a socket's room.
     */
    socket.on('sendMessage', function (message) {
        broadcastMessage(socket, message);
    });

    /**
     * Server has been asked to delete a room that it created and was unused.
     */
    socket.on('sendDeleteRoom', function (room) {
        rooms = _.without(rooms, room);
    });

    /**
     * Server has been asked to check if a room exists.
     * Valid is true when the room exists, false when it does not.
     */
    socket.on('checkRoom', function (name, fn) {
        fn({'valid': rooms.indexOf(name) > -1});
    });

    /**
     * Server has been asked to generate a new room.
     * Response is set to the name of the new room.
     */
    socket.on('getRoom', function (fn) {
        var n = 'the-' + _.sample(adjectives) + '-' + _.sample(colors) + '-' + _.sample(nouns);
        while (rooms.indexOf(n) > -1 && n.length > 32) {
            n = 'the-' + _.sample(adjectives) + '-' + _.sample(colors) + '-' + _.sample(nouns);
        }
        rooms.push(n);
        roomsWithUsers[n] = [];
        fn({'response': n});
    });

    /**
     * Server has been asked to send an array of users in a room.
     * Response is set to an array of the users in the room.
     */
     socket.on('getUsers', function (room, fn) {
        fn({'response': roomsWithUsers[room]});
     });

    /**
     * Server has been asked to move a socket to a room.
     * Success is true when setting was successful, false when it failed.
     */
    socket.on('setRoom', function (room, fn) {
        socket.join(room);
        socket.roomname = room;
        broadcastUserJoined(socket);
        fn({'success': true});
    });

    /**
     * Server has been asked to a set a socket's name.
     * Success is true when setting was successful, false when it failed.
     */
    socket.on('setNickname', function (data, fn) {
        socket.nickname = data;
        fn({'success': true, 'userID': socket.id});
    });

    /**
     * Server has been notified of a user disconnecting.
     */
     socket.on('disconnect', function () {
        broadcastUserDisconnected(socket);
     });
});


// WebRTC configuration
easyrtc.roomDefaultEnable = false;


// Start server, and tell us it's running
server.listen(128);
rtcServer.listen(8080);
var easyrtcServer;


// Check if started debug mode before starting RTC server
if (process.argv[2] === '0') {
    easyrtcServer = easyrtc.listen(rtcApp, rtcIO, {logLevel:"debug", logDateEnable:true});
} else {
    easyrtcServer = easyrtc.listen(rtcApp, rtcIO);
}