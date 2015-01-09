var http = require('http'),
    express = require('express'),
    jade = require('jade'),
    app = module.exports.app = express(),
    server = http.createServer(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.render('home.jade');
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
});

server.listen(128);
console.log('Server Running...');