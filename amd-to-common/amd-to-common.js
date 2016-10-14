var fs = require('fs');
var _ = require('underscore');
var _util = feather.util;
var esprima = require('esprima');
var traverse = require('traverse');

var AMDNode = require('./lib/AMDNode');
var requireConverter = require('./lib/require-converter');
var exportConverter = require('./lib/export-converter');
var strictConverter = require('./lib/strict-converter');

var AMDToCommon = (function(){
  'use strict';

  /**
   * Constructor function for the Human library
   * @param {Object} [options]
   * @private
   */
  var _convert = function(options){
    options = options || {};
    this.files = options.files;
    this.parseOptions = { range: true, comment: true };
  };

  /**
   * Read each file and analyse the content
   */
  _convert.prototype.analyse = function(){
    _.each(this.files, _.bind(function(filename){
      var content = fs.readFileSync(filename, 'utf-8');
      var newContent = this.convertToCommon(content);
      if(newContent === content){
        return;
      }
      fs.writeFileSync(filename, newContent);
    }, this));

    return true;
  };

  /**
   * Given the contents of a JS source file, parse the source
   * with esprima, then traverse the AST. Convert to common and
   * and output the new source.
   * @param {String} content The source content
   * @returns {String} The converted source, or the same source if nothing changed.
   */
  _convert.prototype.convertToCommon = function(content){

    var code = esprima.parse(content, this.parseOptions);

    var validNodeIndex = 0;
    var isIfCJS = false, isIfAMD = false, isIfCJSNode = null, isIfAMDNode = null;

    var amdNodes = traverse(code).reduce(function(memo, node){
      var amdNode = new AMDNode(node);
      
      /*判断是否有commonjs兼容格式*/
      if( amdNode.isCommonJs() ){
        isIfCJS = true;
        isIfCJSNode =  amdNode;
      }  
      
      /*判断是否有amd兼容格式*/
      if( amdNode.isAmd() ){
        isIfAMD = true;
        isIfAMDNode =  amdNode;
      } 
      
      /*获取amd形式定义的函数*/
      if(amdNode.isAMDStyle()){
        memo.push(amdNode);
        validNodeIndex = amdNode.getValidNodeIndex();
      }

      return memo;
    }, []);

    /*如果既有cjs定义，又有amd形式定义，直接去掉amd兼容*/
    if( isIfCJS ){
      if( isIfAMD ){
          var range = isIfAMDNode.getRange();
          var fileResult =  content.replace(content.substring(range[0],range[1]), '');
          return fileResult;
      }
    }

    /*amd-to-common*/
    var validNode = _.first(amdNodes);

    if( !validNode ){
      return content;
    }

    var withRequire = requireConverter(content, validNode);
    var secondPassNode = esprima.parse(withRequire, this.parseOptions);
    var withExport = exportConverter(withRequire, secondPassNode);
    var thirdPassNode = esprima.parse(withExport, this.parseOptions);
    var commonjsResult =  strictConverter(withExport, thirdPassNode);
    var defineStartIndex =  validNode.node.range[0];
    var defineEndIndex = validNode.node.range[1];
    var fileResult =  content.replace(content.substring(defineStartIndex,defineEndIndex), commonjsResult);

    if( !isIfCJS ){
      if( isIfAMD ){
        var testRange = isIfAMDNode.node.test.range;
        fileResult = fileResult.substring(0, testRange[0]) + 'typeof module === "object" && typeof module.exports === "object"' + fileResult.substring(testRange[1]);
      }
    }

    return this.removeDefine(fileResult);

  };

  _convert.prototype.removeDefine = function(content){
    var code = esprima.parse(content, this.parseOptions);

    var validNodeIndex = 0;

    var amdNodes = traverse(code).reduce(function(memo, node){
      var amdNode = new AMDNode(node);
      
      if(amdNode.isAMDStyle()){
        memo.push(amdNode);
        validNodeIndex = amdNode.getValidNodeIndex();
      }

      return memo;
    }, []);

    var validNode = _.first(amdNodes);

    if( !validNode ){
      return content;
    }

    var difineNode = validNode.node.range;
    var functionNode = validNode.node.expression.arguments[0].body.range;

    var fileResult =  content.replace(content.substring(difineNode[0],difineNode[1]), content.substring(functionNode[0]+1,functionNode[1]-1));

    return fileResult;

  };

  return _convert;
})();

module.exports = AMDToCommon;
