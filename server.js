// All Module Imports
var _ = require('underscore'),
    http = require('http'),
    express = require('express'),
    jade = require('jade'),
    fs = require('fs'),
    xmlstream = require('xml-stream'),
    app = module.exports.app = express(),
    server = http.createServer(app);

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
    rooms = [];
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
var io = require('socket.io').listen(server);


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
                'nickname': socket.nickname};
    socket.broadcast.to(socket.roomname).emit('broadcastMessage', data);
    console.log("user " + socket.nickname + " sent this: " + message);
}

/**
 * Send a notificiation to all sockets in a given room.
 * @socket {socket} The socket about which the notification is about.
 * @notification {string} The notification being snet.
 */
function broadcastNotification(socket, notification) {
    var data = {'notification': notification};
    socket.broadcast.to(socket.roomname).emit('broadcastNotification', data);
    console.log(socket.roomname + ': ' + notification);
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
        while (rooms.indexOf(n) > -1) {
            n = 'the-' + _.sample(adjectives) + '-' + _.sample(colors) + '-' + _.sample(nouns);
        }
        rooms.push(n);
        fn({'response': n});
    });

    /**
     * Server has been asked to move a socket to a room.
     * Success is true when setting was successful, false when it failed.
     */
    socket.on('setRoom', function (room, fn) {
        socket.join(room);
        socket.roomname = room;
        broadcastNotification(socket, socket.nickname + ' has joined the room.')
        fn({'success': true});
    });

    /**
     * Server has been asked to a set a socket's name.
     * Success is true when setting was successful, false when it failed.
     */
    socket.on('setNickname', function (data, fn) {
        socket.nickname = data;
        fn({'success': true});
    });
});


// Start server, and tell us it's running
server.listen(128);
console.log('Server Running...');