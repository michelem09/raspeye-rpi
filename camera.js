var sys = require('sys'),
    request = require('request'),
    fs = require('fs'),
    exec = require('child_process').exec,
    api = 'http://cam.michelem.org',
    auth = {
      username: 'upload',
      password: 'upload'
    },
    takePicture,
    uploadPicture,
    syncPictures;

/**
 * File upload
 * Delete file on 200 OK
 *
 * @param string fileName
 * @return void
 */
uploadPicture = function (fileName, callback) {
  if (api.length === 0) {
    return false;
  }

  fs.exists(fileName, function (exists) {
    if (!exists) {
      return false;
    }

    fs.createReadStream(fileName).pipe(request.post(api + '/upload/', function (error, response, body) {
      if (response && response.statusCode === 200) {
        fs.unlink(fileName, function (err) {});
      }

      setTimeout(function () { takePicture() }, 60000);

    }).auth(auth.username, auth.password, true));
  });
};

/**
 * Execute default raspistill command, saving picture in /images/
 *
 * @return void
 */
takePicture = function (callback) {
  var now = new Date(),
      fileName = '/home/michele/camera/' + now.getTime() + '.jpg';
  exec('raspistill -o ' + fileName + ' -w 1280 -h 1024 -q 35', function (err, stdin, stdout) {
    console.log('Taking picture');
    if (!err) {
      uploadPicture(fileName);
    } else {
	console.log(err);
    }
  });
};

/**
 * Find files that didn't get deleted (sign of failed upload) and try to upload them again
 *
 * @return void
 */
syncPictures = function () {
  fs.readdir('/home/michele/camera/', function (err, files) {
    if (err) {
      return false;
    }

    if (files.length > 0) {
      var queueUpload = function (i) {
        setTimeout(function () {
          uploadPicture('/home/michele/camera/' + files[i]);
        }, i * 200);
      };

      for (var i = 0; i < files.length; i++) {
        queueUpload(i);
      }
    }
  });
};

// Ready for take-off!
syncPictures();
takePicture();
