(function() {

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

  //// Connect to skeleton server
  var kinect = openni('/skeleton');


  //// Initialize Scene

  var world = (function() {

    console.log('Initializing world...');

    var camera = new THREE.PerspectiveCamera(
          35, window.innerWidth / window.innerHeight, 1, 8000 );
        camera.position.x = 2000;
        camera.position.y = 1000;
        camera.position.z = 7000;

    var scene = new THREE.Scene();
    //scene.fog = new THREE.Fog(0x000000, 1500, 4000);

    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight - 100);

    $("#container").append(renderer.domElement);

    camera.lookAt(scene.position);

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

  //// Initialize new users
  kinect.on('newuser', function(userId) {

    console.log('newuser', userId);
    if (! users[userId]) {

      var material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } );
      var geometry = new THREE.SphereGeometry( 20 );

      var user = {};
      jointNames.forEach(function(jointName) {
        var joint = new THREE.Mesh( geometry, material );
        user[jointName] = joint;
        scene.add(joint);
      });
      users[userId] = user;
    }
  });

  //// Remove lost users
  kinect.on('lostuser', function(userId) {
    console.log('lostuser', userId);
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
      if (!user) return;
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

  function render() {
    renderer.render(scene, camera);
  }

  animate();

}());