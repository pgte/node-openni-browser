(function() {

  //// Initialize audio and then everything else

  sampleURLs = [
    '/samples/Tr1 Conga 1.wav'
  , '/samples/Tr1 Conga 2.wav'
  , '/samples/Tr1 Cymbal.wav'
  , '/samples/Tr1 Kick 1.wav'
  , '/samples/Tr1 Kick 2.wav'
  , '/samples/Tr1 Kick 3.wav'
  , '/samples/Tr1 Kick 4.wav'
  , '/samples/Tr1 Scratch 1.wav'
  , '/samples/Tr1 Scratch 2.wav'
  , '/samples/Tr1 Shaker 1.wav'
  , '/samples/Tr1 Shaker 2.wav'
  , '/samples/Tr1 Snare 1.wav'
  , '/samples/Tr1 Snare 2.wav'
  , '/samples/Tr1 Snare 3.wav'
  , '/samples/Tr1 Snare 4.wav'
  , '/samples/Tr1 Snare 5.wav'
  , '/samples/Tr1 Tom 1.wav'
  , '/samples/Tr1 Tom 2.wav'
  // , '/samples/fx/01.wav'
  // , '/samples/fx/02.wav'
  // , '/samples/fx/03.wav'
  // , '/samples/fx/04.wav'
  // , '/samples/fx/05.wav'
  // , '/samples/fx/06.wav'
  // , '/samples/fx/07.wav'
  // , '/samples/fx/08.wav'
  // , '/samples/fx/09.wav'
  // , '/samples/fx/10.wav'
  // , '/samples/fx/11.wav'
  // , '/samples/fx/12.wav'
  // , '/samples/fx/13.wav'
  // , '/samples/fx/14.wav'
  // , '/samples/fx/15.wav'
  // , '/samples/fx/16.wav'
  // , '/samples/fx/17.wav'
  // , '/samples/fx/18.wav'
  // , '/samples/fx/19.wav'
  // , '/samples/fx/20.wav'
  // , '/samples/fx/21.wav'
  // , '/samples/fx/22.wav'
  // , '/samples/fx/23.wav'
  // , '/samples/fx/24.wav'
  // , '/samples/fx/25.wav'
  // , '/samples/fx/26.wav'
  // , '/samples/fx/27.wav'
  // , '/samples/fx/28.wav'
  // , '/samples/fx/29.wav'
  // , '/samples/fx/30.wav'
  // , '/samples/fx/31.wav'
  // , '/samples/fx/32.wav'
  // , '/samples/fx/33.wav'
  // , '/samples/fx/34.wav'
  // , '/samples/fx/35.wav'
  // , '/samples/fx/36.wav'
  // , '/samples/fx/37.wav'
  // , '/samples/fx/38.wav'
  // , '/samples/fx/39.wav'
  // , '/samples/fx/40.wav'
  // , '/samples/fx/41.wav'
  // , '/samples/fx/42.wav'
  // , '/samples/fx/43.wav'
  // , '/samples/fx/44.wav'
  // , '/samples/fx/45.wav'
  // , '/samples/fx/46.wav'
  // , '/samples/fx/47.wav'
  // , '/samples/fx/48.wav'
  // , '/samples/fx/49.wav'
  // , '/samples/fx/50.wav'
  // , '/samples/fx/51.wav'
  // , '/samples/fx/52.wav'
  // , '/samples/fx/53.wav'
  ];

  audio(sampleURLs, function(err, samples, audioContext) {
    if (err) throw err;

    loadBuffer(audioContext, '/samples/Tr1 Shaker 2.wav', function(click) {
      /// ------ Initialize sequencer

      var sequencer = Sequencer(120, click, audioContext);
      sequencer.start();

      /// ------ Which joints to track

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
        camera.position.x = 2000;
        camera.position.y = 1000;
        camera.position.z = 6000;

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
          meshCanvas.position.y = -100;

          scene.add(meshCanvas);
        }());


        /// Renderer

        var renderer = new THREE.WebGLRenderer({antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor( scene.fog.color, 1 );
        renderer.autoClear = false;

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

      var material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false, fog: true } );
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
        var maxWidth = 70 * 15;
        var radius = maxWidth / samples.length;
        var halfRadius = radius / 2;
        var geometry = new THREE.CubeGeometry(radius, 100, 300, 1, 1, 1);

        var x = -(samples.length / 2 * 1.5) * radius;
        var color = 0xffffff;
        var colorGrad = Math.floor(color / samples.length / 2);

        samples.forEach(function(sample) {
          var material = new THREE.MeshBasicMaterial( { color: color, wireframe: false, fog: false } );
          var drum = new THREE.Mesh(geometry, material);
          drum.position.x = x;
          drum.position.y = 50;
          drum.position.z = 2300; 

          drum.intercepts = function(point) {
            var pos = this.position;
            return (pos.x - halfRadius < point.x) && (pos.x + halfRadius > point.x) &&
                   (pos.y - halfRadius < point.y) && (pos.y + halfRadius > point.y)
                   ;
          };

          drum.sample = sample;
          drum.contains = {};
          drum.canFire = 0;

          drums.push(drum);
          scene.add(drum);

          x += radius + halfRadius;
          color -= colorGrad;
        });

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
            drum.position.y -= 40;
            sequencer.schedule(drum.sample);
            setTimeout(function() {
              drum.position.y += 40;
            }, 500);
            
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

        mouseX = event.clientX;
        mouseY = event.clientY;

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
        // camera.lookAt(drums[Math.round(drums.length / 2)].position);
        renderer.render(scene, camera);
      }

      animate();
    });


  });

}());