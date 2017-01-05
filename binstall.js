var path = require("path");
var fs = require("fs");
var request = require("request");
var tar = require("tar");
var zlib = require("zlib");

function binstall(url, tarArgs, options) {
  options = options || {};

  var verbose = options.verbose;
  var verify = options.verify;

  return new Promise(function(resolve, reject) {
    var untar = tar.Extract(tarArgs)
        .on("error", function(error) {
          reject("Error extracting " + url + " - " + error);
        })
        .on("end", function() {
          var successMessage = "Successfully downloaded and processed " + url;

          if (verify) {
            verifyContents(verify).then(function() {
              resolve(successMessage);
            }).catch(reject);
          } else {
            resolve(successMessage);
          }
        });

    var gunzip = zlib.createGunzip()
        .on("error", function(error) {
          reject("Error decompressing " + url + " " + error);
        });

    request.get(url, function(error, response) {
      if(error) {
        reject("Error communicating with URL " + url + " " + error);
        return;
      }
      if (response.statusCode == 404) {
        reject("Unfortunately, there are currently no Elm Platform binaries available for your operating system and architecture.\n\nIf you would like to build Elm from source, there are instructions at https://github.com/elm-lang/elm-platform#build-from-source\n");
        return;
      }

      if (verbose) {
        console.log("Downloading binaries from " + url);
      }

      response.on("error", function(error) {
        reject("Error receiving " + url);
      });
    }).pipe(gunzip).pipe(untar);
  });
}

function verifyContents(files) {
  return Promise.all(
    files.map(function(filePath) {
      return new Promise(function(resolve, reject) {
        fs.stat(filePath, function(err, stats) {
          if (err) {
            reject(filePath + " was not found.");
          } else if (!stats.isFile()) {
            reject(filePath + " was not a file.");
          } else {
            resolve();
          }
        });
      });
    })
  );
}

module.exports = binstall;
