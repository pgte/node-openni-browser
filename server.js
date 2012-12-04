var shoe = require('shoe');
var http = require('http');
var OpenNI = require('openni');
var JSONStream = require('JSONStream');
var emitStream = require('emit-stream');
var eventStream = require('event-stream');
var pup = require('pup');

module.exports = function() {
  var skeleton = OpenNI();

  var users = [];

  skeleton.on('newuser', function(userId) {
    if (users.indexOf(userId) < 0) users.push(userId);
  });

  skeleton.on('lostuser', function(userId) {
    var index = users.indexOf(userId);
    if (index >= 0) users.splice(index, 1);
  });

  // Transform event emitter into stream
  var skelStream = emitStream.toStream(skeleton);

  var sock = shoe(function (stream) {

    ///// -----  Write:

    var stringify = JSONStream.stringify();
    pup.pipe(skelStream, stringify);
    pup.pipe(stringify, stream);

    ///// -----  Read:

    var parse = JSONStream.parse([true]);
    pup.pipe(stream, parse);

    var upStreamEmitter = emitStream.fromStream(parse);
    upStreamEmitter.on('joints', function(_joints) {
      console.log('TODO: set joints');
    });

    ///// -----  End:

    stream.on('end', function () {
      pup.unpipe(skelStream, stringify);
      pup.unpipe(stringify, stream);
    });

    ///// ----- Notify of already existing users

    users.forEach(function(userId) {
      skelStream.emit('newuser', userId);
    });

  });

  return sock;
}