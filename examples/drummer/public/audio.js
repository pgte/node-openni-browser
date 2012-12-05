var async = require('async');

window.audio = function(sampleURLs, callback) {
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

  var samples = [];
  async.forEach(sampleURLs, function(url, done) {
    loadBuffer(ctx, url, function(buffer) {
      samples.push(buffer);
      done();
    });
  }, function(err) {
    callback(err, samples, ctx);
  });

}
