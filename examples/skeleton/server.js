var kinectSock = require('../..')();
var ecstatic = require('ecstatic')(__dirname + '/public');

var server = require('http').createServer(ecstatic);

kinectSock.install(server, '/skeleton');

server.listen(8080, function() {
  console.log('kinect socks server listening...');
});