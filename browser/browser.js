var shoe = require('shoe');
var JSONStream = require('JSONStream');
var emitStream = require('emit-stream');

window.openni = module.exports = function(serverPath) {
  
  var stream = shoe(serverPath);
  
  var jsonStream = JSONStream.parse([true]);
  var kinect = stream.pipe(jsonStream);
  var emitter = emitStream.fromStream(jsonStream);

  var jsonWriteStream = JSONStream.stringify();
  jsonWriteStream.pipe(stream);

  // Forward the connect event to the kinect object
  stream.on('connect', function() {
    emitter.emit('connect');
  });

  return emitter;
}