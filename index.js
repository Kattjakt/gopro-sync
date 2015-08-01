var request = require('request');
var http = require('http');
var colors = require('colors');
var cheerio = require('cheerio');
var fs = require('fs');
var async = require('async');
var cliargs = require("command-line-args");
var statusbar = require('status-bar');

var cli = cliargs([
    { name: "ip", type: String, alias: "ip", description: "Choose a custom device IP" },
    { name: "directory", type: String, alias: "d", description: "Output directory for synced media" }
]);

var Gopro = function() {
  var args = cli.parse();
  this.options = {
    path: args.directory || 'out/',
    ip:   args.ip        || 'http://10.5.5.9',
    allowedFiles: ['JPG', 'MP4']
  };
};

Gopro.prototype.fetch = function(filename, callback) {
  var file = fs.createWriteStream(this.options.path + filename);
  var request = http.get(this.options.ip + '/videos/DCIM/100GOPRO/' + filename, function(response) {
      var bar = statusbar.create({
        total: response.headers['content-length']
      }).on('render', function(stats) {
        process.stdout.write(
            filename.yellow + '  ' +
            this.format.storage(stats.currentSize) + ' ' +
            this.format.speed(stats.speed) + ' ' +
            this.format.time(stats.elapsedTime) + ' ' +
            this.format.time(stats.remainingTime) + ' [' +
            this.format.progressBar(stats.percentage) + '] ' +
            this.format.percentage(stats.percentage));
        process.stdout.cursorTo(0);
      });

      response.pipe(bar);
      response.pipe(file);
      file.on('finish', function() {
          callback();
      });
  }).on('error', function(error) {
    if (bar) bar.cancel();
    console.log(error);
  });
};


Gopro.prototype.sync = function() {
    var self = this;

    // Create our output directory if it doesn't already exist
    console.log('output directory set to: ' + self.options.path.yellow);
    if (!fs.existsSync(self.options.path)) {
      fs.mkdirSync(self.options.path);
    }

    // Get a list of all files currently stored on the Gopro unit
    request(self.options.ip + '/videos/DCIM/100GOPRO/', function(error, resp, body) {
      if (error) {
        return console.error(error.message);
      }

      //
      var html = cheerio.load(body)('a.link[href]');
      var filenames = [];
      html.each(function(i) {
        filenames.push(html[i].attribs.href);
      });

      // ...
      async.eachLimit(filenames, 1, function(filename, next) {
        var extension = filename.split('.').pop();
        if (self.options.allowedFiles.indexOf(extension) != -1) {
          self.fetch(filename, next);
        } else {
          next();
        }
      }, function() {
        console.log("FINISHED".blue);
      });
    });
  };

var g = new Gopro();
g.sync();
