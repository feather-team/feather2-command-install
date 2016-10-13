'use strict';

var fs = require('fs');
var _ = feather.util;
var normalize = require('path').normalize;
var AMDToCommon = require('./amd-to-common/amd-to-common');

module.exports = function(name){
    var dir = normalize(process.cwd()) + '/components/' + name + '/';
    var filePath = _.isFile(normalize(dir+name+'.js')) ? normalize(dir+name+'.js') : normalize(dir + '/js/' +name+'.js');
    var file = _.read(filePath);

    function getAllFiles(dir,callback) {
        var filesArr = [];
        (function dir(dirpath, fn) {
            var files = fs.readdirSync(dirpath);
            files.forEach(function (item, next) {
                var info = fs.statSync(dirpath + item);
                if (info.isDirectory()) {
                    dir(dirpath + item + '/');
                } else {
                    var filePath = dirpath + item;
                    var ldot = filePath.lastIndexOf(".");
                    var type = filePath.substring(ldot + 1);
                    if(type == "js") {
                        filesArr.push(dirpath + item);
                    }
                }
            });
        })(dir);
        return filesArr;
    }

    var converter = new AMDToCommon({
        files: getAllFiles(dir)
    });
    converter.analyse();
};