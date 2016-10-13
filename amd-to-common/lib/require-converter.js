var _ = require('underscore');

/**
 * Make the require statements.
 * TOOD: Add support for different tab spacing/quote styles
 * @param {String} name The package name
 * @param {String} identifier Identifier name
 * @returns {string} A require statement
 */
var makeRequireStatement = function(name, identifier, type){
  //改进er：如果依赖里有require、exports、module，则无需为他们定义变量
  if( name ){
    if( name!='require' && name!='exports' && name!='module'){
      if( identifier != undefined ){
        return 'var ' + identifier + ' = require(\'' + name + '\');';
      }else{
        if( type == 3 ){
          return 'require(\'' + name + '\'),';
        }else{
          return 'require(\'' + name + '\');';
        }
      }
    }
  }
  return '';
};

var getRequireStatements = function(content, amdNode){
  var requireStatementsType = amdNode.getIsFunctionNode() ;
  var requireStatements = _.reduce(amdNode.getDependencyMap(), function(memo,identifier,name){
      memo = memo + '\n  ' + makeRequireStatement(name, identifier, requireStatementsType );
      return memo;
  }, '');

  if( requireStatementsType == 3 ){
    requireStatements = requireStatements.substring(0, requireStatements.length-1);
  }
  return requireStatements;
};

/**
 * Add the import statements to the code, right after the initial function block
 * @param content
 * @param amdNode
 * @returns {string}
 */

var addImportStatements = function(content, amdNode){
  console.log(JSON.stringify(amdNode,null,4));
  var defineEnd = amdNode.node.range[1];
  var functionNode = amdNode.getFunctionNode();
  var requireStatements = '';

  if( amdNode.getValidNodeIndex() != -1){
    requireStatements = getRequireStatements(content, amdNode);
  } 

  if( functionNode != null ){
    if( amdNode.getIsFunctionNode() == 1){
      var functionBlockStart = functionNode.body.range[0] + 1;
    }else{
      var functionBlockStart = functionNode.range[0] + 1;
    }

    var defineStatement = content.substring(0, functionBlockStart);
    var block = content.substring(functionBlockStart, defineEnd);
    return defineStatement + requireStatements + block;
  }else{
    return requireStatements;
  }

};

/**
 * Converts the node to the CommonJS style by getting a bunch of locations
 * from the node and doing some nasty string replacements.
 * Ideally this would use something like escodegen, but we don't want to rewrite other
 * stylistic differences in the project.
 * @param {String} content The original source as a string
 * @param {AMDNode} amdNode The AMD node
 * @returns {string} The converted source.
 */
 addRequireStatement = function(content, amdNode){

  var functionNode = amdNode.getFunctionNode();
  var IsFunctionNode = amdNode.getIsFunctionNode();
  var defineEnd = amdNode.node.range[1];
  var requireStatements = '';
  var defineString = 'define(';

  if( amdNode.getValidNodeIndex() != -1){
    requireStatements = getRequireStatements(content, amdNode);
  } 

  if( IsFunctionNode == 1){
    var functionBlockStart = functionNode.body.range[0];
    var newDefine = 'function(require, exports, module){';
    var blockContent = content.substring(functionBlockStart+1, content.length);
    return defineString + newDefine + requireStatements + blockContent;
  }else if( IsFunctionNode == 2){
    var functionBlockStart = functionNode.range[0];
    var functionBlockEnd = functionNode.range[1];
    var newDefine = 'function(require, exports, module){';
    var blockContent = content.substring(functionBlockStart, functionBlockEnd);
    return defineString + newDefine + requireStatements + 'return ' + blockContent + ';});';
  }else if( IsFunctionNode == 3){
    var functionBlockStart = functionNode.range[0];
    var newDefine = 'function(require, exports, module){';
    var requireStatements = getRequireStatements(content, amdNode);
    var blockContent = 'return '+ functionNode.name + '(' + requireStatements + ');});';
    return defineString + newDefine + blockContent;
  }else{
    var newDefine = 'function(require, exports, module){';
    var blockContent = 'return "";';
    return defineString + newDefine + requireStatements  + blockContent + '});';
  }
};

/**
 * Convert to commonJS style imports
 * Add the import statements first so that we don't mess up the ranges.
 * This works because changing the function definition all happens on
 * the code before the imports.
 * @param content
 * @param amdNode
 * @returns {string}
 */
module.exports = function convert(content, amdNode){
  return addRequireStatement(content, amdNode);
};
