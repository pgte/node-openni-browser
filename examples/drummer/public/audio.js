var async = require('async');

window.audio = function(callback) {
  var ctx = new webkitAudioContext();

  function loadBuffer(context, url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var onDecode = function(buffer) {
      console.log("decoded");
      callback(buffer);
    };
    var onError = function(err) {
      console.log("error decoding", url)
    }
    request.onload = function() {
      console.log('Loaded', url);
      context.decodeAudioData(request.response, onDecode, onError);
    }
    request.send();
  };

  var samples = {
    '/samples/Tr1 Kick 3.wav': null
  };

  async.forEach(Object.keys(samples), function(url, done) {
    loadBuffer(ctx, url, function(buffer) {
      samples[url] = buffer;
      done();
    });
  }, function() {
    callback(samples, ctx);
  });

}
