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
  if( type != 3 ){
    if( name && name!='require' && name!='exports' && name!='module'){
      return 'var ' + name + ' = require(\'' + identifier + '\');';
    }else{
      return '';
    }
  }else{
    return 'require(\'' + identifier + '\')';
  }
};

var getRequireStatements = function(content, amdNode){
  var requireStatementsType = amdNode.getIsFunctionNode() ;
  if( requireStatementsType != 3 ){
    var requireStatements = _.reduce(amdNode.getDependencyMap(), function(memo, name, identifier){
      memo = memo + '\n  ' + makeRequireStatement(name, identifier, requireStatementsType );
      return memo;
    }, '');
  }else{
    var requireStatements = _.reduce(amdNode.getDependencyMap(), function(memo, name, identifier){
      memo.push(makeRequireStatement(name, identifier, requireStatementsType));
      return memo;
    }, []);
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
  var defineEnd = amdNode.node.range[1];
  var functionNode = amdNode.getFunctionNode();
  var requireStatements = '';

  if( amdNode.getIsFunctionNode() == 1){
    var functionBlockStart = functionNode.body.range[0] + 1;
  }else{
    var functionBlockStart = functionNode.range[0] + 1;
  }

  if( amdNode.getValidNodeIndex() != -1){
    requireStatements = getRequireStatements(content, amdNode);
  } 

  var defineStatement = content.substring(0, functionBlockStart);
  var block = content.substring(functionBlockStart, defineEnd);

  return defineStatement + requireStatements + block;
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
  var argumentsStart = amdNode.getArrayNode().range[0];
  var functionNode = amdNode.getFunctionNode();
  var defineStart = amdNode.node.range[0];
  var defineString = content.substring(defineStart, argumentsStart);

  if( amdNode.getIsFunctionNode() == 1){
    var functionBlockStart = functionNode.body.range[0];
    var newDefine = 'function(require, exports, module)';
    var blockContent = content.substring(functionBlockStart, content.length);
    var result = defineString + newDefine + blockContent;
    return defineString + newDefine + blockContent;
  }else if( amdNode.getIsFunctionNode() == 2){
    var functionBlockStart = functionNode.range[0];
    var functionBlockEnd = functionNode.range[1];
    var newDefine = 'function(require, exports, module){';
    var blockContent = content.substring(functionBlockStart, functionBlockEnd);
    var result = defineString + newDefine + 'return ' + blockContent + '});';
    return defineString + newDefine + 'return ' + blockContent + '});';
  }else if( amdNode.getIsFunctionNode() == 3){
    var functionBlockStart = functionNode.range[0];
    var newDefine = 'function(require, exports, module){';
    var requireStatements = getRequireStatements(content, amdNode);
    var blockContent = 'return '+ functionNode.name + '(\n' + requireStatements.join(',\n') + '\n);});';
    var result = defineString + newDefine + blockContent ;
    return defineString + newDefine + blockContent;
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
  var withImports = addImportStatements(content, amdNode);
  // console.log(withImports);
  // console.log(addRequireStatement(withImports, amdNode));
  return addRequireStatement(withImports, amdNode);
};
