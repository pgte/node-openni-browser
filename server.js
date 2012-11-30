var shoe = require('shoe');
var http = require('http');
var OpenNI = require('openni');
var JSONStream = require('JSONStream');
var emitStream = require('emit-stream');
var eventStream = require('event-stream');
var pup = require('pup');

module.exports = function() {
  var skeleton = OpenNI();

  var skelStream = emitStream.toStream(skeleton);
  
  var sock = shoe(function (stream) {

    // Keep track of which joints the user wants the server to emit
    var trackJoints = [];

    ///// -----  Write:

    // Filter all joint changes to the joints the client has requested
    filterSkel = eventStream.mapSync(function(data) {
      var jointName = data[0];
      if (trackJoints.indexOf(jointName) > -1) return data;
    });
    pup.pipe(skelStream, filterSkel);

    var stringify = JSONStream.stringify();
    pup.pipe(filterSkel, stringify);
    pup.pipe(stringify, stream);

    ///// -----  Read:

    var parse = JSONStream.parse([true]);
    pup.pipe(stream, parse);

    var upStreamEmitter = emitStream.fromStream(parse);
    upStreamEmitter.on('joints', function(_joints) {
      trackJoints = _joints;
      console.log('Joints are now', trackJoints);
    });


    ///// -----  End:

    stream.on('end', function () {
      pup.unpipe(skelStream, filterSkel);
      pup.unpipe(filterSkel, stringify);
      pup.unpipe(stringify, stream);
    });

  });

  return sock;
}