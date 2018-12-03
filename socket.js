
 1. 도커
 2. 컨테이너


	var socket = io.connect("http://52.79.195.245:9006");

	function onairLive(){
		try {
			socket.on('letterTextOnairAlarm', function(data){
				onairLivePrt(data);
			});
			clearTimeout(wsLiveText);
		} catch (e){
			wsLiveText = window.setTimeout("onairLive()", 1000);
		}
	};
 
이벤트 보내기	socket.emit('이벤트명',{메세지}); 
이벤트 받기		socket.on('이벤트명',function(data){ });
나를 제외한 다른 클라이언트들에게 이벤트 보내기 socket.broadcast.emit('이벤트명',{메세지});

나를 포함한 모든 클라이언트들에게 이벤트 보내기io.sockets.emit('이벤트명',function(data){ });




############# server

var Server = require('socket.io')
var io = new Server(httpServer);
축약버젼 : var io = require('socket.io')(server)



var express = require('express');
var http = require('http');
var app = express();

var server = http.createServer(app);
server.listen(3000);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client.html');
});

var io = require('socket.io')(server);
io.on('connect', function(socket) {
	console.log('클라이언트 접속');

	socket.on('disconnect', function() {
		console.log('클라이언트 접속 종료');
	});
	setInterval(function(){
		socket.emit('message', '메세지');
	}, 3000);

});





############ client

<script src="/socket.io/socket.io.js"></script>
<script>
    var socket = io();

    socket.on('connect', function() {
       console.log('서버와 연결');
    });    

</script>


 
 
