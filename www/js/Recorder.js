/*jslint browser: true, indent: 2 */

(function() {
  'use strict';

  var root = this;

  var RecordingsPaths = function(options) {
    this.initialize.call(this, options);
  };

  root.RecordingsPaths = RecordingsPaths;

  _.extend(RecordingsPaths.prototype, {
    initialize: function(options) {
      _.extend(this, options || {});
      this.recordingsRoot = 'Theexperimenters/audio/recordings';
      this.absoluteRoot = ''; // set on prepare - cdvfile://localhost/storage/persistent/assets/rels/
    },

    prepare: function(callback) {
      console.log("RecordingsPaths#prepare");

      var parts = this.recordingsRoot.split('/'),
          current = 0;

      var error = _.bind(function(e) {
        console.log("RecordingsPaths#prepare File Error: " + e.code);

        if(e.code === FileError.PATH_EXISTS_ERR) {
          success();
        } else {
          this.triggger('error', e);
        }
      }, this),
      success = _.bind(function(entry) {
        if(parts[++current]) {
          var path = parts.slice(0, current + 1).join('/');
          fs.getOrCreateDirectory(path, success, error);
        } else {
          this.absoluteRoot = entry.toInternalURL();
          this.writeRecordingFile(parts, callback);
        }
      }, this);

      fs.getOrCreateDirectory(parts[current], _.bind(function() {

        success();
      }, this), error);
    },

    pathFor: function(target, absolute) {
      return this.absoluteRoot + target;
    },

    writeRecordingFile: function(parts, callback) {
      var filePath = parts.join('/') + '/recording.wav',
           fileContent = '';

      console.log('RecordingsPaths#writeRecordingFile filePath', filePath);

      var success = function(message) {
        console.log(message);
        callback();
      };

      var error = _.bind(function(e) {
        console.log('RecordingsPaths#writeRecordingFile error', e.code);
        this.trigger('error', e);
      }, this);

      fs.writeNewFile(filePath, fileContent, success, error);
    }
  });

  var Recorder = function(options){
    options = options || {};
    _.extend(this, _.pick(options, ['$viewEl']));
    this.initialize.call(this, options)
  };

  root.Recorder = Recorder;

  _.extend(Recorder.prototype, RecordingsPaths.prototype, Backbone.Events, {
    initialize: function(options){
      RecordingsPaths.prototype.initialize.call(this);
      this.prepare(_.bind(this.bindAll, this));
      this.recording = false;
    },

    bindAll: function(){
      this.$viewEl.on('click', '.record-toggle', _.bind(this.toggleRecord, this));
      this.$viewEl.on('click', '.play-toggle', _.bind(this.togglePlay, this));
    },

    toggleRecord: function(e){
      var src = this.pathFor('recording.wav');
      console.log('Recorder#toggleRecord src', src);

      if(this.mediaRec) {
        return this.stopRecording();
      }else {
        return this.startRecording(src);
      }
    },

    startRecording: function(src){
      this.mediaRec = new Media(src,
        // success callback
        function() {
            console.log("recordAudio():Audio Success");
        },

        // error callback
        _.bind(function(err) {
            console.log("recordAudio():Audio Error: "+ err.code);
            this.stopRecording();
        }, this));

      // Record audio
      this.mediaRec.startRecord();
    },

    stopRecording: function(){
      if(!this.mediaRec) { return; }

      this.mediaRec.stopRecord();
      this.mediaRec.release();
      this.mediaRec = undefined;
    },

    togglePlay: function(e){
      var src = this.pathFor('recording.wav');
      console.log('Recorder#togglePlay src', src);

      if(this.mediaRec) { this.stopRecording; }
      if(this.mediaPlayer) {
        return this.stopPlayer();
      }else {
        return this.startPlayer(src);
      }
      return false;
    },

    startPlayer: function(src){
      console.log('Recorder#startPlayer');
      this.mediaPlayer = new Media(src,
        // success callback
        function() {
            console.log("recordAudio():Audio Success");
        },

        // error callback
        _.bind(function(err) {
            console.log("recordAudio():Audio Error: "+ err.code);
            this.stopPlayer();
        }, this),

        // playback stopped
        _.bind(function(type) {
          if(type === Media.MEDIA_STOPPED){
            this.stopPlayer();
          }
        }, this)
        );

      this.mediaPlayer.play();
    },

    stopPlayer: function(){
      console.log('Recorder#startPlayer');

      if(!this.mediaPlayer) { return; }
      this.mediaPlayer.stop();
      this.mediaPlayer.release();
      this.mediaPlayer = undefined;
    }
  });

}.call(this));