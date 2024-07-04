'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080);

// 서버를 설정하는 부분
var io = socketIO.listen(app);

io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['서버의 메시지 :'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message,clientAnwerId,clientOfferId) {
    log('클라이언트     : ', message);
     var anwerId
     var offerId 
    // for a real app, would be room-only (not broadcast)
    // socket.broadcast.emit('message', message);
    // socket.emit('message', message);
      anwerId = anwerId || clientAnwerId
      offerId = offerId || clientOfferId
    if (message.type == "offer") {
      message.offerId = offerId
    };
    log('---- anwerId:'+anwerId+"---offerId:"+offerId+" ------ message.type: "+message.type)
    if (anwerId) {
        log(" 인바운드 ID id")
          socket.to(anwerId).emit('message', message);
    }else{
        log(" 들어오지 않은 ID id")
        socket.broadcast.emit('message', message);
    }
  });




  socket.on('create or join', function(room) {
    log('방 만들기 요청 수신 ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('고객 ID' + socket.id + '룸만들기' + room)
      socket.emit('created', socket.id);

    } else if (numClients < 10) {
      log('고객 ID' + socket.id + '방에 들어가' + room)

      // io.sockets.in(room).emit('join',socket.id) // 신규가입자 외 다른 분들은 정보 수신 가능
      // socket.join(room);
      // socket.emit('joined room', room, socket.id)//혼자만 볼 수 있음
      // io.sockets.in(room).emit('ready');

      io.sockets.in(room).emit('join', socket.id); // 신규가입자 외 다른 분들은 정보 수신 가능
      
      socket.join(room);
      socket.emit('joined',room,socket.id,numClients);
      io.sockets.in(room).emit('ready');
      log('고객 ID' + socket.id + '방에 들어가' + room)
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
  });

});
