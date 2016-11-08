'use strict';

var fs = require('fs');
var _ = feather.util;
var normalize = require('path').normalize;
var AMDToCommon = require('./amd-to-common/amd-to-common');

module.exports = function(name){
    var dir = normalize(process.cwd()) + '/components/' + name + '/';
    var files = feather.util.find(dir, '**.js');

    var converter = new AMDToCommon({
        files: files
    });

    try{
        converter.analyse();
        console.log('Convert to CommonJs completed!'.blue);
    }catch(e){
        console.log('Convert to CommonJs failed!'.red);
    }
};