# openni-browser

Server <-> Browser bridge for OpenNI skeleton.

Works with kinect.

Uses Socks.js (via [Shoe](https://github.com/substack/shoe)).

## Install

Install libusb and OpenNI following the platform-specific instructions at https://github.com/OpenNI/OpenNI

```bash
$ npm install openni-browser
```

## Create Node Server

```js
var kinectSock = require('openni-browser')();
var ecstatic = require('ecstatic')(__dirname + '/public');

var server = require('http').createServer(ecstatic);

kinectSock.install(server, '/skeleton');

server.listen(8080, function() {
  console.log('kinect socks server listening...');
});
```

### Create Client

Copy `browser/openni.js` into the public folder.

In your HTML file include that script before the `body` close tag:

```html
<script src="openni.js"></script>
```

Inside a browser script:

Initialize connection to the server by providing a full or relative URL:

```js
var skeleton = openni('/skeleton');
```

Listen for user events:

```js
[
  'newuser',
  'lostuser',
  'posedetected',
  'calibrationstart',
  'calibrationsuccess',
  'calibrationfail'
].forEach(function(userEventType) {
  sleleton.on(userEventType, function(userId) {
    console.log(userEventType + ' (' + userId + ')');
  });
});
```

Listen for joint position changes:

```js

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

jointNames.forEach(function(jointName) {
  kinect.on(jointName, function(userId, x, y, z) {
    console.log('The joint ' + jointName + ' of user ' + userId +
      ' moved to (' + x + ', ' + y + ', ' + z + ')');
  });
});
```

# Connection Handling

The `skeleton` object will also emit:

* `connect` — when there is a connection to the server
* `end` — when the connection to the server is ended

## Examples

See the `examples` folder.

# Licence

MIT