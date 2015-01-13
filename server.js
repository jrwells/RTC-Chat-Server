var _ = require('underscore'),
    http = require('http'),
    express = require('express'),
    jade = require('jade'),
    fs = require('fs'),
    xmlstream = require('xml-stream'),
    app = module.exports.app = express(),
    server = http.createServer(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.render('home.jade');
});

var words = new xmlstream(fs.createReadStream('xml/words.xml')),
    rooms = [];
var adjectives = [],
    colors = [],
    nouns = [];
words.on('text: adjectives > word', function (item) {
    adjectives.push(item['$text']);
});
words.on('text: colors > word', function (item) {
    colors.push(item['$text']);
});
words.on('text: nouns > word', function (item) {
    nouns.push(item['$text']);
});

var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
    socket.on('setNickname', function (data) {
        socket.nickname = data;
    });
    socket.on('message', function (message) {
        var data = { 'message' : message, 
                     'nickname' : socket.nickname };
        socket.broadcast.emit('message', data);
        console.log("user " + socket.nickname + " sent this: " + message);
    });
    socket.on('checkRoom', function (name, fn) {
        if (rooms.indexOf(name) > -1) {
            fn({valid: true});
        } else {
            fn({valid: false});
        }
    });
    socket.on('getRoomName', function (fn) {
        var n = 'The' + _.sample(adjectives) + _.sample(colors) + _.sample(nouns);
        while (rooms.indexOf(n) > -1) {
            n = 'The' + _.sample(adjectives) + _.sample(colors) + _.sample(nouns);
        }
        rooms.push(n);
        fn({name: n});
    });
    socket.on('joinRoom', function (room, fn) {
        socket.join(room);
        fn({});
    });
});

server.listen(128);
console.log('Server Running...');