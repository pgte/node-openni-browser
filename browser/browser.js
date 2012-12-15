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
  
  var sock = shoe(serverPath);

  var jsonStream = JSONStream.parse([true]);
  var kinect = sock.pipe(jsonStream);
  var skeleton = emitStream.fromStream(jsonStream);

  var jsonWriteStream = JSONStream.stringify();
  jsonWriteStream.pipe(sock);

  skeleton.joints = function(joints) {
    jsonWriteStream.write(['joints', joints]);
  };

  // Intercept emitter add and remove listener calls to register for joints
  (function() {
    var oldAddListener = skeleton.addListener;
    var oldRemoveListener = skeleton.removeListener;
    var joints = [];

    function updateRemoteJoints() {
      skeleton.joints(joints);
    }
    
    skeleton.addListener = skeleton.on = function(eventType, callback) {
      if (jointNames.indexOf(eventType) >= 0) {
        // It's a joint
        if (joints.indexOf(eventType) < 0) {
          joints.push(eventType);
          updateRemoteJoints();
        }
      }
      oldAddListener.apply(skeleton, arguments);
    };

    skeleton.removeListener = function(eventType, callback) {
      console.log('removeListener', arguments);
      if (jointNames.indexOf(eventType) >= 0) {
        // It's a joint
        var index = joints.indexOf(eventType);
        if (index < 0) {
          joints.splice(index, 1);
          updateRemoteJoints();
        }
      }
      oldRemoveListener.apply(skeleton, arguments);
    }

  }());


  // Forward the connect event to the kinect object
  sock.on('connect', function() {
    skeleton.emit('connect');
  });

  sock.on('end', function() {
    skeleton.emit('end');
  });

  skeleton.sock = sock;

  return skeleton;
}