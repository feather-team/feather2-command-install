'use strict';

exports.name = 'install';
exports.usage = 'install [options] <components>[@<version>]';
exports.desc = 'install components';
exports.options = {
    '-F, --force-latest': 'Force latest version on conflict',
    '-f, --force': 'If dependencies are installed, it reinstalls all installed components. It also forces installation even when there are non-bower directories with the same name in the components directory. Also bypasses the cache and overwrites to the cache anyway.',
    '-h, --help': 'Show this help message'
};

var bower = require('bower');
var clean = require('./clean.js');
var amd2commonjs = require('./amd2commonjs.js');

exports.run = function(argv, cli, env) {
    if(argv.h || argv.help){
        return cli.help(exports.usage, exports.options);
    }

    var pkgs = argv._.slice(1).map(function(item){
        return item.toString().split('@').join('#');
    });

    try{
        argv.directory = 'components';
        bower.commands.install(pkgs, argv, argv).on('log', function(data){
            var pkgName = data.data.endpoint.source + '@' + data.data.endpoint.target;
            var message = [
                'download',
                feather.util.pad(pkgName, 20, ' ').green,
                feather.util.pad(data.id, 15, ' ', true).blue,
                data.message
            ];

            console.log(message.join('  '));
        }).on('end', function(pkgs){
            feather.util.map(pkgs, function(name, info){
                console.log('\n' + name + '@' + info.pkgMeta.version + ' components/' + name);

                var deps = [];

                feather.util.map(info.dependencies || {}, function(name, info){
                    deps.push(name + '@' + info.pkgMeta.version);
                });

                var max = deps.length - 1;

                deps.forEach(function(dep, key){
                    var b = key == max ? '└──' : '├──';
                    console.log(b + ' ' + dep);
                });

                //clean 
                clean(name);

                //amd2commonjs
                amd2commonjs(name);
            });
        });
    }catch(e){};

    process.on('uncaughtException', function(err){
        feather.log.throw = false;
        feather.log.error(err.message);
    });
};