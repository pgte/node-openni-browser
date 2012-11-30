var shoe = require('shoe');
var JSONStream = require('JSONStream');

window.openni = module.exports = function(serverPath) {
  
  var stream = shoe(serverPath);
  
  var jsonStream = JSONStream.parse([true]);
  var kinect = stream.pipe(jsonStream);

  var jsonWriteStream = JSONStream.stringify();
  jsonWriteStream.pipe(stream);

  stream.on('connect', function() {
    kinect.emit('connect');
  });

  kinect.joints = function joints(joints) {
    jsonWriteStream.write(['joints', joints]);
  };
  
  return kinect;
}