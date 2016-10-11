'use strict';

var fs = require('fs');
var _ = feather.util;
var normalize = require('path').normalize;
var AMDToCommon = require('./amd-to-common/amd-to-common');

module.exports = function(name){
    var dir = normalize(process.cwd()) + '/components/' + name + '/';
    var filePath = _.isFile(normalize(dir+name+'.js')) ? normalize(dir+name+'.js') : normalize(dir + '/js/' +name+'.js');
    var file = _.read(filePath);

    console.log('filePath:   ' + filePath );

    // _.write(filePath, '123456789', 'utf8', false);

    var converter = new AMDToCommon({
        files: new Array(filePath)
    });
    converter.analyse();
};