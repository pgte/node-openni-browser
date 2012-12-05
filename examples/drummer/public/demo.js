(function() {

  //// Initialize audio and then everything else

  audio(function(samples, audioContext) {
    ///------ Which joints to track

    var jointNames = [
      "head",
      "left_hand",
      "right_hand"
    ];

    //// ------ Connect to skeleton server
    var kinect = openni('/skeleton');


    //// ------ Initialize Scene

    var world = (function() {

      console.log('Initializing world...');

      var camera = new THREE.PerspectiveCamera(
        35, window.innerWidth / window.innerHeight, 1, 5000 );
      // camera.position.x = 1000;
      // camera.position.y = 1000;
      camera.position.z = 5000;

      // Point camera at user?
//      camera.lookAt(new THREE.Vector3(-190, 777, 2520));

      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000000, 1500, 4000);


      /// Floor
      (function() {
        var imageCanvas = document.createElement( "canvas" ),
          context = imageCanvas.getContext( "2d" );

        imageCanvas.width = imageCanvas.height = 128;

        context.fillStyle = "#444";
        context.fillRect( 0, 0, 128, 128 );

        context.fillStyle = "#fff";
        context.fillRect( 0, 0, 64, 64);
        context.fillRect( 64, 64, 64, 64 );

        var textureCanvas = new THREE.Texture( imageCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
          materialCanvas = new THREE.MeshBasicMaterial( { map: textureCanvas } );

        textureCanvas.needsUpdate = true;
        textureCanvas.repeat.set( 1000, 1000 );

        var geometry = new THREE.PlaneGeometry( 100, 100 );

        var meshCanvas = new THREE.Mesh( geometry, materialCanvas );
        meshCanvas.rotation.x = - Math.PI / 2;
        meshCanvas.scale.set( 1000, 1000, 1000 );

        scene.add(meshCanvas);
      }());


      /// Renderer

      var renderer = new THREE.WebGLRenderer({antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor( scene.fog.color, 1 );
      renderer.autoClear = false;

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

    var material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
    var geometry = new THREE.SphereGeometry( 20 );


    //// ------ Track here which users are in the scene
    var users = {};
    var refUser, refJoint;

    //// ------ Initialize new users
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
        refJoint = user.torso || user.head;
      }
    });

    //// ------ Remove lost users
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

    //// ------ Update users joints
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

    ///// ------ Drums

    // Initialize drums and set them in scene

    var drums = (function() {
      var drums = [];
      var material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
      var radius = 250;
      var halfRadius = radius / 2;
      var geometry = new THREE.CubeGeometry(radius, radius, radius, 1, 1, 1);

      var drum = new THREE.Mesh(geometry, material);
      drum.position.x = -100;
      drum.position.y = 400;
      drum.position.z = 2000; 

      drum.intercepts = function(point) {
        var pos = this.position;
        return (pos.x - halfRadius < point.x) && (pos.x + halfRadius > point.x) &&
               (pos.y - halfRadius < point.y) && (pos.y + halfRadius > point.y) &&
               (pos.z - halfRadius < point.z) && (pos.z + halfRadius > point.z)
               ;
      };

      drum.sample = samples['/samples/Tr1 Kick 3.wav'];
      drum.contains = {};
      drum.canFire = 0;

      drums.push(drum);
      scene.add(drum);

      return drums;
    }());


    ///// ------ Audio

    var triggerAudio = (function() {

      var gainNode = audioContext.createGainNode();
      gainNode.gain.value = 0.5;

      var connect = function(node) {
        node.connect(gainNode);
        gainNode.connect(audioContext.destination);
      }

      drums.forEach(function(drum) {
        drum.play = function() {
          var osc = audioContext.createBufferSource();
          osc.buffer = drum.sample;
          osc.connect(audioContext.destination);
          osc.noteOn(0);
        };
      });

      var hands = ['left_hand', 'right_hand'];

      function trigger() {
        Object.keys(users).forEach(function(userId) {
          var user = users[userId];
          hands.forEach(function(hand) {
            var handPos = user[hand].position;
            drums.forEach(function(drum) {
              if (drum.contains[hand]) {
                if (! drum.intercepts(handPos)) {
                  drum.contains[hand] = false;
                }
              } else if (drum.intercepts(handPos) &&
                         drum.canFire < audioContext.currentTime) {
                // Did not contain hand and now hand is inside
                drum.play();
                drum.canFire = audioContext.currentTime + 0.2;
                drum.contains[hand] = true;
              }
            });
          });
        });
      }

      return trigger;
    }());

    ///// ------ Mouse Move

    var mouseX = 0;
    var mouseY = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    function onDocumentMouseMove(event) {

      mouseX = ( event.clientX - windowHalfX );
      mouseY = ( event.clientY - windowHalfY );

    }
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    ///// ------ Animation

    function animate() {
      triggerAudio();
      requestAnimationFrame(animate);
      render();
    }

    function render() {
      camera.position.x += ( mouseX - camera.position.x ) * .05;
      camera.position.y += ( - ( mouseY - 200) - camera.position.y ) * .05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }

    animate();
  });

}());