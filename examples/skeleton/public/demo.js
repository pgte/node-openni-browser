(function() {

  jointNames = [
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

  //// Connect to skeleton server
  var kinect = openni('/skeleton');

  //// Initialize Scene

  var world = (function() {

    console.log('Initializing world...');

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 5000;

    scene = new THREE.Scene();

    material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
    geometry = new THREE.SphereGeometry( 20 );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    $("#container").append(renderer.domElement);

    return {
      scene: scene
    , camera: camera
    , renderer: renderer
    };

  }());

  var scene = world.scene;
  var camera = world.camera;
  var renderer = world.renderer;

  //// Track here which users are in the scene
  var users = {};
  var refUser;

  //// Initialize new users
  kinect.on('newuser', function(userId) {
    console.log('newuser', userId);
    if (! users[userId]) {
      var user = {};
      jointNames.forEach(function(jointName) {
        var joint = new THREE.Mesh( geometry, material );
        user[jointName] = joint;
        scene.add(joint);
      });
      users[userId] = user;
      refUser = user;
    }
  });

  //// Remove lost users
  kinect.on('lostuser', function(userId) {
    console.log('lostuser', user);
    var user = users[userId];
    if (user) {
      var joints = Object.keys(user);
      joints.forEach(function(jointName) {
        scene.remove(user[jointName]);
      });
      delete users[userId];
    }
  });

  //// Update users joints
  jointNames.forEach(function(jointName) {
    kinect.on(jointName, function(userId, x, y, z) {
      var user = users[userId];
      var joint = user[jointName]
      if (joint) {
        joint = joint.position;
        joint.x = x;
        joint.y = y;
        joint.z = z;
      }
    });
  });

  [
    'posedetected',
    'calibrationstart',
    'calibrationsuccess',
    'calibrationfail'
  ].forEach(function(userEventType) {
    kinect.on(userEventType, function(userId) {
      console.log(userEventType + ' (' + userId + ')');
    });
  });

  function animate() {
     requestAnimationFrame(animate);
     render();
  }

  var refVec = new THREE.Vector3(0, 0, 0);

  function render() {
    var refJoint = refUser && refUser.torso;
    if (! refJoint) return;
    refVec.set(refJoint.position.x, refJoint.position.y, refJoint.position.z);
    camera.lookAt(refVec);
    renderer.render(scene, camera);
  }

  animate();

}());