var request = require('request');
var colors = require('colors');
var spinner = require('cli-spinner');
var cheerio = require('cheerio');
var fs = require('fs');
var http = require('http');
var wait = require('wait.for');
var async = require('async');


var spinner = new spinner.Spinner('%s');

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

process.stdout.write("connecting to GoPro unit (10.5.5.9)... ")
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
        if (filename.split(".") != 'THM' &&
            filename.split(".") != 'LRV') {
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





























































