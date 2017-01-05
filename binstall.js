var path = require("path");
var fs = require("fs");
var request = require("request");
var tar = require("tar");
var zlib = require("zlib");

function binstall(url, tarArgs, options) {
  var verbose = typeof options === "object" && options.verbose;

  return new Promise(function(resolve, reject) {
    var untar = tar.Extract(tarArgs)
        .on("error", function(error) {
          reject("Error extracting " + url + " - " + error);
        })
        .on("end", function() {
          resolve("Successfully downloaded and processed " + url);
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

module.exports = binstall;
