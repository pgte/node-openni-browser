var async = require('async');

window.loadBuffer = function loadBuffer(context, url, callback) {
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



window.audio = function(sampleURLs, callback) {
  var ctx = new webkitAudioContext();

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

window.Sequencer = function(tempo, clickBuffer, audioContext) {
  var lastTime = Math.ceil(audioContext.currentTime);
  var quantum = (60 / tempo) / 2;
  var clickInterval = quantum * 4;
  var nextTime_ = lastTime;

  //// Play sound
  function playSound(buffer, time) {
    var osc = audioContext.createBufferSource();
    osc.buffer = buffer;
    osc.connect(audioContext.destination);
    osc.noteOn(time);
  }

  //// Metronome
  var metronome;
  function start() {
    lastClick = nextTime() + 1;
    metronome = setInterval(scheduleMetronomeBeat, 1000);
  }

  function stop() {
    clearInterval(metronome);
  }

  var lastClick;
  function scheduleMetronomeBeat() {
    var stop = lastClick + 1;
    while(lastClick < stop) {
      lastClick += clickInterval;
      playSound(clickBuffer, lastClick);
    }
  }

  //// Sequencer
  function nextTime() {
    while(nextTime_ < audioContext.currentTime) {
      nextTime_ += quantum;
    }
    return nextTime_;
  }

  function schedule(sample) {
    playSound(sample, nextTime());
  }

  return {
    schedule: schedule,
    start: start,
    stop: stop
  };
}