#!/usr/bin/env node

/* global require  */
/* global __dirname */

var shell = require('shelljs');

//this hook installs all your plugins

// add your plugins to this list--either
// the identifier, the filesystem location
// or the URL
var pluginlist = [
  "org.apache.cordova.console@0.2.11",
  // "org.apache.cordova.file@1.3.1",
  "org.apache.cordova.file",
  "org.apache.cordova.file-transfer",
  // "org.apache.cordova.media@0.2.14",
  "org.apache.cordova.media",
  "org.apache.cordova.device@0.2.12",
  "org.apache.cordova.statusbar@0.1.8",
  "org.apache.cordova.network-information",
  "org.apache.cordova.splashscreen@0.2.5"
];

shell.echo('Adding plugins');

pluginlist.forEach(function(plugin){
  shell.exec("cordova plugin add " + plugin);
  shell.echo('Added plugin ', plugin);
});
