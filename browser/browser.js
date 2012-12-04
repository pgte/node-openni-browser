var shoe = require('shoe');
var JSONStream = require('JSONStream');
var emitStream = require('emit-stream');

window.openni = module.exports = function(serverPath) {

  var jointNames = [
    "head",
    "neck",
    "torso",
    "waist",
    "left_collar",
    "left_shoulder",
    "left_elbow",
    "left_wrist",
    "left_hand",
    "left_fingertip",
    "right_collar",
    "right_shoulder",
    "right_elbow",
    "right_wrist",
    "right_hand",
    "right_fingertip",
    "left_hip",
    "left_knee",
    "left_ankle",
    "left_foot",
    "right_hip",
    "right_knee",
    "right_ankle",
    "right_foot"  
  ];
  
  var stream = shoe(serverPath);

  var jsonStream = JSONStream.parse([true]);
  var kinect = stream.pipe(jsonStream);
  var emitter = emitStream.fromStream(jsonStream);

  var jsonWriteStream = JSONStream.stringify();
  jsonWriteStream.pipe(stream);

  emitter.joints = function(joints) {
    jsonWriteStream.write(['joints', joints]);
  };

  // Intercept emitter add and remove listener calls to register for joints
  (function() {
    var oldAddListener = emitter.addListener;
    var oldRemoveListener = emitter.removeListener;
    var joints = [];

    function updateRemoteJoints() {
      emitter.joints(joints);
    }
    
    emitter.addListener = emitter.on = function(eventType, callback) {
      if (jointNames.indexOf(eventType) >= 0) {
        // It's a joint
        if (joints.indexOf(eventType) < 0) {
          joints.push(eventType);
          updateRemoteJoints();
        }
      }
      oldAddListener.apply(emitter, arguments);
    };

    emitter.removeListener = function(eventType, callback) {
      console.log('removeListener', arguments);
      if (jointNames.indexOf(eventType) >= 0) {
        // It's a joint
        var index = joints.indexOf(eventType);
        if (index < 0) {
          joints.splice(index, 1);
          updateRemoteJoints();
        }
      }
      oldRemoveListener.apply(emitter, arguments);
    }

  }());


  // Forward the connect event to the kinect object
  stream.on('connect', function() {
    emitter.emit('connect');
  });

  return emitter;
}