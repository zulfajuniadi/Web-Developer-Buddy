;
(function() {
    var http = require('http');
    var sockjs = require('sockjs');
    var async = require('async');
    var less = require('less');
    var path = require('path');
    var mkdirp = require('mkdirp');
    var node_static = require('node-static');
    var url = require('url');
    var qs = require('querystring');
    var sjsServer = sockjs.createServer({
        log: function() {}
    });
    var walk = require('fs-walk');
    var fs = require('fs');
    var _ = require('lodash')._;
    var portastic = require('portastic');
    var port = 8684;
    var qs = require('querystring');
    var watchedExtensions = [];
    var waitingClients = [];
    var dirs = [];
    var lessFiles = [];
    var lessImports = {};
    var watchedFiles = [];
    var thisRun = [];
    var lastRun = [];

    function flushClients(file) {
        waitingClients.forEach(function(conn) {
            var message = {
                action: 'reload',
                file: path.basename(file)
            }
            if (conn.paths) {
                conn.paths.forEach(function(path) {
                    if (file.indexOf(path) > -1) {
                        console.log('clients flushed : ' + file);
                        conn.write(JSON.stringify(message));
                    }
                });
            }
        });
    }


    function compileLess(filename) {
        var clientsThatCompileLess = _.where(waitingClients, {
            compileLess: true
        });
        if (clientsThatCompileLess.length > 0) {
            clientsThatCompileLess.forEach(function(conn) {
                var compileTheseFiles = [];
                conn.lessConfig.forEach(function(settings) {
                    var source = Object.keys(settings)[0];
                    var output = settings[source] || source.replace('.less', '.css');
                    var sourcePath = lessFiles.filter(function(lessFile) {
                        return lessFile.indexOf(source) > -1;
                    });
                    if (sourcePath) {
                        compileTheseFiles.push({
                            sourcePath: sourcePath[0],
                            outputPath: path.resolve(path.dirname(sourcePath[0]), output)
                        });
                    }
                });
                async.forEach(compileTheseFiles, function(settings, callback) {
                    var inputFile = settings.sourcePath;
                    var outputFile = settings.outputPath;
                    less.render(fs.readFileSync(inputFile, 'utf8'), {
                        paths: [path.dirname(inputFile), path.dirname(outputFile)],
                        compress: true,
                        sourceMap: true,
                        verbose: true,
                        filename: inputFile
                    }, function(e, css) {
                        if (e) {
                            return console.log(e);
                        }
                        var outputBaseDir = path.dirname(outputFile);

                        if (!fs.existsSync(outputBaseDir)) {
                            mkdirp.sync(outputBaseDir);
                        }

                        console.log('LESS processed ' + inputFile + ' >>> ' + outputFile);

                        fs.writeFileSync(outputFile, css);
                        callback();
                    });
                }, function() {
                    // console.log('Recompiled less');
                });
            });
        }
    }

    function setUpdated(file) {
        console.log(file + ' updated')
        flushClients(file);
    }

    var loop = 1;

    function walkDirCallback() {
        lastRun = thisRun;
        setTimeout(walkDir, 1000);
        loop += 1;
    }

    function walkDir() {
        var numFiles = 0;
        var newFile = {};
        thisRun = null;
        thisRun = [];
        async.forEach(dirs, function(dir, callback) {
            var filePath, mtime, file, fileExtension;
            walk.walk(dir, function(basedir, filename, stat, next) {
                fileExtension = path.extname(filename).replace('.', '');
                if (watchedExtensions.indexOf(fileExtension) > -1 && !stat.isDirectory()) {
                    filePath = path.join(basedir, filename);
                    if (fileExtension === 'less' && lessFiles.indexOf(filePath) === -1) {
                        lessFiles.push(filePath);
                    }
                    mtime = stat.mtime.getTime();
                    file = watchedFiles.filter(function(f) {
                        return f.filePath == filePath;
                    });
                    if (file.length > 0) {
                        if (file[0].mtime < mtime) {
                            file[0].mtime = mtime;
                            if (fileExtension === 'less') {
                                compileLess(filePath);
                            } else {
                                setUpdated(filePath);
                            }
                        }
                    } else {
                        newFile = {
                            filePath: filePath,
                            extension: fileExtension,
                            mtime: mtime
                        };
                        watchedFiles.push(newFile);
                    }
                    thisRun.push(filePath);
                    numFiles += 1;
                }
                next();
            }, callback);
        }, function() {
            if (JSON.stringify(thisRun) !== JSON.stringify(lastRun) || newFile.filePath !== undefined) {
                var diff = _.difference(lastRun, thisRun) || [newFile];
                if (diff.length > 0) {
                    if (filename) {
                        var fileExtension = path.extname(filename).replace('.', '');
                        if (fileExtension === 'less') {
                            compileLess(diff[0]);
                        } else {
                            setUpdated(diff[0]);
                        }
                    }
                }
            }
            return walkDirCallback();
        });
    }

    sjsServer.on('connection', function(conn) {

        console.log('Client ' + conn.id + ' connected from IP ' + conn.remoteAddress);

        conn.on('data', function(message) {
            var config = JSON.parse(message);
            var errors = [];
            if (config.paths) {
                if (!Array.isArray(config.paths)) {
                    config.paths = [config.paths];
                }
                config.paths.forEach(function(path) {
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
                config.extensions.forEach(function(extension) {
                    if (typeof extension === 'string' && watchedExtensions.indexOf(extension) === -1) {
                        watchedExtensions.push(extension);
                    }
                });
            }
            if (config.less) {
                if (!Array.isArray(config.less)) {
                    config.less = [config.less];
                }
            }
            if (errors.length > 0) {
                setTimeout(function() {
                    conn.write(JSON.stringify({
                        error: errors
                    }));
                }, 5000);
            } else {
                conn.paths = config.paths;
                if (config.less) {
                    if (config.less.length > 0) {
                        conn.compileLess = true;
                        conn.lessConfig = config.less;
                    }
                }
                waitingClients = waitingClients.filter(function(conn) {
                    return JSON.stringify(conn.paths) !== JSON.stringify(config.paths);
                })
                waitingClients.push(conn);
            }
        });
    });

    var staticDir = path.join(process.cwd(), '/public');
    console.log('Serving webdevbuddy.js from: ' + staticDir);
    var static_directory = new node_static.Server(staticDir, {
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    });
    var server = http.createServer();


    function getFileExtensions(dir, callback) {
        var reply = {
            extensions: [],
            lessFiles: []
        };

        walk.walk(dir, function(basedir, filename, stat, next) {
            var fileExtension = path.extname(filename).replace('.', '');
            var baseFileName = path.basename(filename);
            if (!stat.isDirectory() && fileExtension !== '') {
                if (reply.extensions.indexOf(fileExtension) === -1) {
                    reply.extensions.push(fileExtension);
                }
                if (reply.lessFiles.indexOf(baseFileName) === -1 && fileExtension === 'less') {
                    reply.lessFiles.push(baseFileName);
                }
            }
            next();
        }, function() {
            callback(reply);
        });

    }

    server.addListener('request', function(req, res) {
        var uriInfo = url.parse(req.url);
        if (uriInfo.pathname.indexOf('/webdevbuddy.js') > -1 || uriInfo.pathname.indexOf('/wdb') > -1) {
            return static_directory.serve(req, res);
        } else if (uriInfo.pathname.indexOf('/dirinfo') > -1) {
            if (uriInfo.query === null)
                return res.end('[]');
            else {
                var data = qs.parse(uriInfo.query);
                if (fs.existsSync(data.path)) {
                    return getFileExtensions(data.path, function(reply) {
                        var resp = {
                            exts: reply.extensions,
                            less: reply.lessFiles
                        }
                        res.end(JSON.stringify(resp));
                    });
                } else {
                    return res.end('0');
                }
            }
        }
        return res.end('Not Implemented');
    });

    server.addListener('upgrade', function(req, res) {
        res.end();
    });

    sjsServer.installHandlers(server, {
        prefix: '/wdb'
    });

    console.log('Web Dev Buddy Listening on 0.0.0.0:' + port);
    server.listen(port, '0.0.0.0');

    walkDir();
}).call(this);