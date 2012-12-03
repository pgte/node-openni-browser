(function() {
  var kinect = openni('/skeleton');

  console.log('Initialized kinect connection.');

  var world = (function() {

    console.log('Initializing world...');

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

    var joints = {};

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 4000;

    scene = new THREE.Scene();

    material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
    geometry = new THREE.SphereGeometry( 20 );
    
    jointNames.forEach(function(jointName) {
      var joint = new THREE.Mesh( geometry, material );
      joints[jointName] = joint;
      scene.add(joint);
    });

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    $("#container").append(renderer.domElement);

    return {
      scene: scene
    , camera: camera
    , renderer: renderer
    , joints: joints
    };

  }());

  var scene = world.scene;
  var camera = world.camera;
  var renderer = world.renderer;
  var joints = world.joints;

  function update(jointName, user, x, y, z) {
    var joint = joints[jointName]
    if (joint) {
      joint = joint.position;
      joint.x = x;
      joint.y = y;
      joint.z = z;
    }
    
  }

  kinect.on('data', function(data) {
    update.apply({}, data);
  });

  kinect.on('connect', function() {
    kinect.joints(jointNames);
  });

  function animate() {

     requestAnimationFrame( animate );
     render();

  }

  var refVec = new THREE.Vector3(0, 0, 0);

  function render() {
    var refJoint = joints.torso || joints.head;
    refVec.set(refJoint.position.x, refJoint.position.y, refJoint.position.z);
    camera.lookAt(refVec);
    renderer.render( scene, camera );
  }

  animate();

}());