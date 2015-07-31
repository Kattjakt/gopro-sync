var request = require('request');
var colors = require('colors');
var spinner = require('cli-spinner');
var cheerio = require('cheerio');
var fs = require('fs');
var http = require('http');
var wait = require('wait.for');
var async = require('async');
var cliArgs = require("command-line-args");

//var spinner = new spinner.Spinner('%s');

var cli = cliArgs([
    { name: "ip", type: String, alias: "ip", description: "Choose a custom device IP" },
    { name: "directory", type: String, alias: "d", description: "Output directory for synced media" }
]);


var Gopro = function() {
  var args = cli.parse();
  this.options = {
    path: args.directory  || 'out/',
    ip:   args.ip         || 'http://10.5.5.9',
    allowedFiles: ['JPG', 'MP4']
  };

  this.fetch = function(filename, callback) {
    var self = this;

    var file = fs.createWriteStream(self.options.path + filename);
    var req = request(self.options.ip + '/videos/DCIM/100GOPRO/' + filename, function(response) {
      response.pipe(file);
    });

    //req.pipe(out);
    req.on('error', function() {
      console.log('REQUEST ERROR'.red);
    });

    callback();
  };
};

Gopro.prototype.sync = function() {
    var self = this;

    console.log('output directory set to: ' + self.options.path.yellow);
    if (!fs.existsSync(self.options.path)) {
      fs.mkdirSync(self.options.path);
    }

    // Get a list of all files currently stored on the Gopro unit
    request(self.options.ip + '/videos/DCIM/100GOPRO/', function(error, resp, body) {
      if (error) {
        return console.error(error.message);
      }

      var html = cheerio.load(body);
      var links = html('a.link[href]');

      wait.launchFiber(function() {
        for (var i = 0; i < links.length; i++) {

          // Get the full filename and extension of the current file
          var filename = links[i].attribs.href;
          var extension = filename.split('.').pop();

          // Check if the extension is in the allowed list
          if (self.options.allowedFiles.indexOf(extension) == -1) {
            console.log('banned extension, skipping ' + filename.yellow);
          } else {
            // If not, download the media
            //self.fetch(filename);
            //wait.for(self.fetch, filename);
            console.log('downloading: ' + filename.yellow);


            var out = fs.createWriteStream(self.options.path + filename);

            var req = wait.for(request, self.options.ip + '/videos/DCIM/100GOPRO/' + filename);
            fs.writeFile(self.options.path + filename, JSON.stringify(req.body), function(err) {
              if (err) return console.log(err);
            });

            //req.pipe(out);
            req.on('error', function() {
              console.log('REQUEST ERROR'.red);
            });
            

          }
        }
      });
    });
  };

/*
    wait.launchFiber(function() {
      var body = wait.for(request, self.options.ip + '/videos/DCIM/100GOPRO');
      var html = cheerio.load(body);
      var links = html('a.link[href]');

      links.each(function(i) {
        var filename = links[i].attribs.href;
        var extension = filename.split('.').pop();

        // Check if the extension is in the allowed list
        if (self.options.allowedFiles.indexOf(extension) != -1) {
          console.log('banned extension, skipping ' + filename.yellow);
        } else {
          self.fetch(filename);

        }


      });
    });
};
*/
var g = new Gopro();
g.sync();

/*
// Check if the user provided a custom output directory
var path = process.argv[2];
if (path) {
    console.log('output directory set to: ' + path.yellow);
} else {
    console.log('no output directory specified, assuming ./out'.yellow);
    path = './out';
}

// Create the directory if it doesn't already exist
if (!fs.existsSync(path)) {
    process.stdout.write('directory ' + path.yellow + ' not found, creating... ');
    fs.mkdirSync(path);
    console.log('ok'.green);
}

process.stdout.write("connecting to GoPro unit (10.5.5.9)... ");
request('http://10.5.5.9/videos/DCIM/100GOPRO', function(error, response, body) {
    if (error) {
        return console.error(('unable to connect [' + error.code + ']').red);
    }

    console.log('ok'.green);
    process.stdout.write('parsing html to get file paths... ');

    var html = cheerio.load(body);
    console.log('ok'.green);

    var links = html('a.link[href]');

    console.log('found a total of ' + String(links.length).yellow + ' items\n');


    var i = 0;
    async.whilst(function() {
        return i < links.length;
    },
    function (next, cb) {
        filename = links[i].attribs.href;
        extension = filename.split('.').pop();

        if (extension == 'LRV' || extension == 'THM') {

        }



        if (fs.readdirSync(path).indexOf(filename) != -1) {
            console.log('file ' + filename.yellow + ' found in output directory, skipping');
            i++;
            next();
        } else {
            console.log('starting download of ' + filename.yellow + '... ');

            var file = fs.createWriteStream(path + '/' + filename);
            var request = http.get("http://10.5.5.9/videos/DCIM/100GOPRO/" + filename, function(response) {
                response.pipe(file);
                file.on('finish', function() {
                    file.close(cb);
                    i++;
                    next();
                });
            }).on('error', function(err) {
                fs.unlink(path + '/' + filename);
                if (cb) cb(err.message);
            });
        }
    },
    function (err) {
        console.log('\ndone!'.green);
    });
});


function transfer(filename, outputdir) {
    // Skip file if we have already downloaded it
    if (fs.readdirSync(outputdir).indexOf(filename) != -1) {
        console.log('file ' + filename.yellow + ' found in output directory, skipping');
        return false;
    }

    console.log('starting download of ' + filename.yellow + '... ');

    var file = fs.createWriteStream(outputdir + '/' + filename);
    http.get("http://10.5.5.9/videos/DCIM/100GOPRO/" + filename, function(response) {
        response.pipe(file);
    });

    console.log("DONE?");
}
*/
