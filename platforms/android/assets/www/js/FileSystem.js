(function(){
  'use strict';

  var root = this;

  var FileSystem = function(){};

  root.fs = FileSystem;

  FileSystem.getDirectory = function(relativePath, success, error) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
      fileSystem.root.getDirectory(relativePath, {create: false, exclusive: false}, success, error);
    }, error);
  };

  FileSystem.getOrCreateDirectory = function(relativePath, success, error){
    function errorHandler(e){
      return error(e);
    }

    function extractFullPath(directoryEntry){
      return success(directoryEntry);
    }

    function proxiedGetOrCreateDirectory(fileSystem){
      fileSystem.root.getDirectory(relativePath, {create: true, exclusive: false}, extractFullPath, errorHandler);
    }

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, proxiedGetOrCreateDirectory, errorHandler);
  };

  FileSystem.fileExistsAndValid = function (relativePath, success, missing, invalid) {
    var errorHandler = function(e){
      var fileNotFound = e.code === FileError.NOT_FOUND_ERR;
      if(fileNotFound){
        if(missing) { missing(e); }
      }else{
        if(invalid){ invalid(e); }
      }
    };

    var onFSWin = function(fileSystem) {
      fileSystem.root.getFile(relativePath, {create: false, exclusive: false}, success, errorHandler);
    };

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSWin, errorHandler);
  };

  FileSystem.fileModified = function (relativePath, success, error) {
    var errorHandler = function(e){
      error(e);
    };

    var onFileHandle = function(m){
      return success((new Date(m.modificationTime)).toUTCString());
    };

    var onGetFileWin = function(fileEntry){
      fileEntry.getMetadata(onFileHandle, errorHandler);
    };

    var onFSWin = function(fileSystem) {
      fileSystem.root.getFile(relativePath, {create: false, exclusive: false}, onGetFileWin, errorHandler);
    };

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSWin, errorHandler);
  };

  FileSystem.removeFile = function (relativePath, success, error) {
    var errorHandler = function(e){
      if (error) {
        error(e);
      }
    };

    var onGetFileWin = function(fileEntry){
      fileEntry.remove(success, errorHandler);
    };

    var onFSWin = function(fileSystem) {
      fileSystem.root.getFile(relativePath, {create: false, exclusive: false}, onGetFileWin, errorHandler);
    };

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSWin, errorHandler);
  };

  // Read a file as a data url - eg. an image
  FileSystem.readDataUrl = function(path, success, error, store) {
    store || (store = LocalFileSystem.TEMPORARY);
    if(device.platform === 'Android') {
      store = LocalFileSystem.PERSISTENT;
      }
    var onError = function(err) {
      if(error) { error(err); }
    };

    var onFileSystem = function(fileSystem) {
      fileSystem.root.getFile(path, null, onFileEntry, onError);
    };

    var onFileEntry = function(fileEntry) {
      fileEntry.file(onFile, onError);
    };

    var onFile = function(file) {
      readDataUrl(file);
    };

    var readDataUrl = function(file) {
      var reader = new FileReader();
      reader.onerror = onError;
      reader.onloadend = function(event) {
        success(event.target.result);
      };
      reader.readAsDataURL(file);
    };
    window.requestFileSystem(store, 0, onFileSystem, onError);
  };

  FileSystem.removeDir = function (relativePath, success, error) {
    var errorHandler = function(e){
      if (error) {
        error(e);
      }
    };

    var onGetDirWin = function(dirEntry){
      dirEntry.removeRecursively(success, errorHandler);
    };

    var onFSWin = function(fileSystem) {
      fileSystem.root.getDirectory(relativePath, {create: false, exclusive: false}, onGetDirWin, errorHandler);
    };

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSWin, errorHandler);
  };

  FileSystem.readFile = function(relativePath, success, error){
    var fullPath;

    var errorHandler = function(e){
      error(e);
    };

    var onLoadEnd = function(evt){
      return success({text: evt.target.result, fullPath: fullPath});
    };

    var onFileHandle = function(file){
      var reader = new FileReader();
      fullPath = file.fullPath;
      reader.onloadend = onLoadEnd;
      reader.readAsText(file);
    };

    var onGetFileWin = function(fileEntry){
      fileEntry.file(onFileHandle, errorHandler);
    };

    var onFSWin = function(fileSystem) {
      fileSystem.root.getFile(relativePath, {create: false, exclusive: false}, onGetFileWin, errorHandler);
    };

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSWin, errorHandler);
  };

  // Doesn't overwrite the file if it exists
  FileSystem.writeNewFile = function(relativePath, content, success, error) {
    var errorHandler = function(e){
      error(e);
    };

    var onWriteEnd = function(evt) {
      return success(relativePath + ' created');
    };

    var gotFileWriter = function(writer) {
      writer.onwriteend = onWriteEnd;
      writer.write(content);
    };

    var onCreateFileWin = function(fileEntry) {
      fileEntry.createWriter(gotFileWriter, errorHandler);
    };

    var writeFile = function(fileSystem) {
      fileSystem.root.getFile(relativePath, {create: true, exclusive: false}, onCreateFileWin, errorHandler);
    };

    var onReadFileError = function() {
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, writeFile, errorHandler);
    };

    var onReadFileWin = function() {
      return success(relativePath + ' exists');
    };

    var readFile = function(fileSystem) {
      fileSystem.root.getFile(relativePath, {create: false, exclusive: false}, onReadFileWin, onReadFileError);
    };

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, readFile, errorHandler);
  };
}.call(this));
