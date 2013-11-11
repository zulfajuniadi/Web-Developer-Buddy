;(function(){
    var http = require('http');
    var sockjs = require('sockjs');
    var async = require('async');
    var less = require('less');
    var path = require('path');
    var mkdirp = require('mkdirp');
    var node_static = require('node-static');
    var sjsServer = sockjs.createServer({
        log: function () {}
    });
    var walk = require('fs-walk');
    var fs = require('fs');
    var _ = require('lodash')._;
    var portastic = require('portastic');
    var port = 8684;
    var watchedExtensions = [];
    var lastReload = null;
    var firstRun = true;
    var waitingClients = [];
    var dirs = [];
    var lessFiles = [];
    var watchedFiles = {};

        function flushClients(file) {
            waitingClients.forEach(function (conn) {
                var message = {
                    action: 'reload',
                    file : file.replace(path.dirname(file),'').replace('/','').replace('\\', '')
                }

                conn.write(JSON.stringify(message));
            });
            console.log('clients flushed : ' + file);
        }

        function setUpdated(dir, file) {
            if (file.split('.').reverse()[0] === 'less') {
                lessFiles.forEach(function (lessConfigObj) {
                    var lessFileName = Object.keys(lessConfigObj)[0];
                    var foundLessFiles = dir.filter(function(fileObj){
                        return fileObj.filePath.indexOf(lessFileName) > -1;
                    });
                    async.forEach(foundLessFiles, function (fileObj, callback) {
                        var processLessFile = fileObj.filePath;
                        var parser = new(less.Parser)({
                            paths: ['.'],
                            filename: processLessFile
                        });
                        var contents = fs.readFileSync(processLessFile, 'utf8');
                        parser.parse(contents, function (e, tree) {
                            if (e) {
                                return console.log(e);
                            }
                            var outputFile = path.resolve(path.dirname(processLessFile), lessConfigObj[lessFileName]);
                            var outputBaseDir = path.dirname(outputFile);

                            if (!fs.existsSync(outputBaseDir)) {
                                mkdirp.sync(outputBaseDir);
                            }

                            console.log('LESS processed ' + processLessFile + ' >>> ' + outputFile);

                            fs.writeFileSync(outputFile, tree.toCSS({
                                compress: true
                            }));

                            callback();
                        });
                    }, function(){
                        flushClients('css');
                    });
                });
            } else {
                flushClients(file);
            }
        }

        var loop = 1;

        function walkDirCallback() {
            setTimeout(walkDir, 1000);
            loop += 1;
        }

        /* loop vars */

        function walkDir() {
            var numFiles = 0;
            async.forEach(dirs, function (dir, callback) {
                var filePath, mtime, file, fileExtension, watchedFilesDir;
                walk.walk(dir, function (basedir, filename, stat, next) {
                    if (!watchedFiles[dir]) {
                        watchedFiles[dir] = [];
                    }
                    watchedFilesDir = watchedFiles[dir];

                    fileExtension = filename.split('.').reverse()[0];
                    if (watchedExtensions.indexOf(fileExtension) > -1 && !stat.isDirectory()) {
                        filePath = basedir + '/' + filename;
                        mtime = stat.mtime.getTime();
                        if (firstRun) {
                            watchedFilesDir.push({
                                filePath: filePath,
                                extension: fileExtension,
                                mtime: mtime
                            });
                        } else {
                            file = watchedFilesDir.filter(function (f) {
                                return f.filePath == filePath;
                            });
                            if (file.length > 0) {
                                if (file[0].mtime < mtime) {
                                    file[0].mtime = mtime;
                                    setUpdated(watchedFilesDir, filePath);
                                }
                            } else {
                                watchedFilesDir.push({
                                    filePath: filePath,
                                    extension: fileExtension,
                                    mtime: mtime
                                });
                                setUpdated(watchedFilesDir, filePath);
                            }
                        }
                        numFiles += 1;
                    }
                    next();
                }, callback);
            }, function () {
                if (dirs.length > 0) {
                    firstRun = false;
                }
                if (!firstRun && numFiles !== _.flatten(_.map(watchedFiles, _.values)).length && dirs.length > 0) {
                    watchedFiles = {};
                    firstRun = true;
                    setUpdated([], 'Files count is different.');
                }
                return walkDirCallback();
            });
        }

        walkDir();

        sjsServer.on('connection', function (conn) {

            console.log('Client ' + conn.id + ' connected from IP ' + conn.remoteAddress);

            conn.on('data', function (message) {
                var config = JSON.parse(message);
                var errors = [];
                if (config.paths) {
                    if (!Array.isArray(config.paths)) {
                        config.paths = [config.paths];
                    }
                    config.paths.forEach(function (path) {
                        if (typeof path === 'string' && dirs.indexOf(path) === -1) {
                            if (!fs.existsSync(path)) {
                                errors.push('Path ' + path + ' does not exists');
                            } else {
                                dirs.push(path);
                            }
                        }
                    });
                }
                if (config.extensions) {
                    if (!Array.isArray(config.extensions)) {
                        config.extensions = [config.extensions];
                    }
                    config.extensions.forEach(function (extension) {
                        if (typeof extension === 'string' && watchedExtensions.indexOf(extension) === -1) {
                            watchedExtensions.push(extension);
                        }
                    });
                }
                if (config.less) {
                    if (!Array.isArray(config.less)) {
                        config.less = [config.less];
                    }
                    config.less.forEach(function (lessObj) {
                        if (typeof lessObj === 'object' && lessFiles.indexOf(lessObj) === -1) {
                            lessFiles.push(lessObj);
                        }
                    });
                }
                if (errors.length > 0) {
                    setTimeout(function () {
                        conn.write(JSON.stringify({
                            error: errors
                        }));
                    }, 5000);
                } else {
                    watchedFiles = {};
                    firstRun = true;
                    conn.dirs = config.paths;
                    conn.watchedExtensions = config.extensions;
                    waitingClients.push(conn);
                }
            });

            conn.on('close', function () {
                setUpdated([], 'Client Disconnected. Resetting.');
                dirs = [];
                lessFiles = [];
                watchedExtensions = [];
                watchedFiles = {};
                firstRun = true;
            });
        });

        var static_directory = new node_static.Server(process.cwd + '/public', {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
        var server = http.createServer();

        server.addListener('request', function (req, res) {
            static_directory.serve(req, res);
        });

        server.addListener('upgrade', function (req, res) {
            res.end();
        });

        sjsServer.installHandlers(server, {
            prefix: '/wdb'
        });

        console.log('Web Dev Buddy Listening on 0.0.0.0:' + port);
        server.listen(port, '0.0.0.0');
}).call(this);