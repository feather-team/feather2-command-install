'use strict';

var fs = require('fs');
var _ = feather.util;
var cleanList = /\.(?:txt|lock|md)|LICENSE|Grunt|gulp|Gemfile/i;
var configFinds =['bower.json', 'component.json', 'package.json', '.bower.json'];
var minReg = /[.-]min(?=\.)/;
var normalize = require('path').normalize;

function del(dir, file){
    var name = file.substr(dir.length);

    if(_.exists(file)){
        console.log('    ' + _.pad(name, 60, ' ') + 'deleted'.red);
        _.del(file);
    }
}

module.exports = function(name){
    var dir = normalize(process.cwd()) + '/components/' + name + '/';
    var files = fs.readdirSync(dir);

    if(files.length){
        console.log('\nclean files:'.yellow);

        var distDir = normalize(dir + 'dist/');
        var hasDist = files.indexOf('dist') > -1 && _.isDir(distDir);

        files.forEach(function(file){
            if(
                cleanList.test(file) 
                || hasDist && file.indexOf('dist') == -1 && configFinds.indexOf(file) == -1
            ){
                del(dir, dir + file);
                return;
            }
        });
    
        var config, json = {};

        for(var i = 0; i < configFinds.length; i++){
            var temp = dir + configFinds[i];

            if(_.exists(temp)){
                json = _.readJSON(temp);
                config = temp;
                break;
            }
        }

        if(config){
            var mains = _.makeArray(json.main), r = [];

            for(var i = 0; i < mains.length; i++){
                if(_.exists(dir + mains[i])){
                    json.main = mains[i];
                    break;
                }
            }

            if(hasDist){
                fs.renameSync(distDir, distDir = dir + '_dist_');
                _.copy(distDir, dir);
                _.del(distDir);              
            }

            var main = json.main;

            if(typeof main == 'string'){
                if(/(?:^|\/)dist\//.test(main)){
                    main = main.replace(/(?:^|\/)dist\//, '');
                }
                
                if(minReg.test(main)){
                    var temp = main.replace(minReg, '');

                    if(_.exists(dir + temp)){
                        main = temp;
                    }
                }
            }  

            json.main = main;
        }

        //clean min
        _.find(dir, minReg).forEach(function(file){
            _.exists(file.replace(minReg, '')) && del(dir, file);
        });

        //clean source map
        _.find(dir, /\.map$/).forEach(function(file){
            del(dir, file);
        })

        _.write(dir + 'bower.json', JSON.stringify(json, null, 2));
    }
};