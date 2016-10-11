var _ = require('underscore');

/**
 *
 * @param node
 * @constructor
 */
var AMDNode = function(node){
  this.node = node;
  this.validNodeIndex = 0;//dependencies定义的位置
  this.functionNodeIndex = 1;//function定义的位置
  this.isFunctionNode = 1; //1:function;2:object;3:factory
};

AMDNode.prototype.getValidNodeIndex = function(){
  return this.validNodeIndex;
};

AMDNode.prototype.getFunctionNodeIndex = function(){
  return this.functionNodeIndex;
};

AMDNode.prototype.getIsFunctionNode = function(){
  return this.isFunctionNode;
};

AMDNode.prototype.isCommonJs = function(){
  var node = this.node;
  if(!node || !node.type || node.type !== 'IfStatement'){
    return false;
  } 
  // console.log(JSON.stringify(node,null,4));
  if( node.test.operator !== '!==' || node.test.operator !== '===' || !node.test.left || node.test.left.operator !== 'typeof' ){
    return false;
  }
  console.log("111222");

  return Boolean( node.test.left.argument && (node.test.left.argument.name === 'exports' || node.test.left.argument.name === 'module') &&  ( node.test.right.value === 'undefined' || node.test.right.value === 'object' ) );
};

AMDNode.prototype.isAmd= function(){
  var node = this.node;
  if(!node || !node.type || node.type !== 'IfStatement'){
    return false;
  } 

  if( node.test.type !=='LogicalExpression' || node.test.left.type !== "BinaryExpression" || node.test.right.type !== "MemberExpression" ){
    return false;
  }

  return Boolean( node.test.right.object && node.test.right.object.name === 'define' && node.test.right.property.name === 'amd' );
};

AMDNode.prototype.getRange = function(){
  var node = this.node;
  if( node.alternate !== null ){
    return new Array(node.range[0],node.alternate.range[0]);
  }else{
    return node.range;
  }
};

/**
 * Determine whether a node represents a requireJS 'define' call.
 * @param {Object} node AST node
 * @returns {Boolean} true if define call, false otherwise
 */
AMDNode.prototype.isDefine = function(){
  var node = this.node;
  if(!node || !node.type || node.type !== 'ExpressionStatement'){
    return false;
  }
  if(node.expression.type !== 'CallExpression'){
    return false;
  }
  return Boolean(node.expression.callee.name === 'define');
};

/**
 * Determine whether a node is an AMD style define call
 * This detects code in the format:
 *    define(['req1', 'req2'], function(Req1, Req1) {})
 * But not:
 *    define(function(require, exports, module){})
 * @param {Object} node AST Node
 * @returns {boolean} true if AMD style, false otherwise
 */
AMDNode.prototype.isAMDStyle = function(){
  if(!this.isDefine()){
    return false;
  }
  console.log("111444");
  var defineArguments = this.node.expression.arguments;

  var defineArgumentsLen = defineArguments.length;
  // console.log('^^^^^^^^^^^^^^^^^^^^^');
  // console.log(defineArgumentsLen);
  // console.log('^^^^^^^^^^^^^^^^^^^^^');
  // console.log(JSON.stringify(defineArguments,null,4));
  // console.log('^^^^^*************^^^^');
  // console.log(Boolean(defineArguments[1].type === 'FunctionExpression'));
  switch( defineArguments.length ){
    case 3:
      this.validNodeIndex = 1;
      this.functionNodeIndex = 2;
      this.isFunctionNode = Boolean(defineArguments[2].type === 'FunctionExpression') ? 1 : Boolean(defineArguments[2].type === 'ObjectExpression') ? 2 : 3;
      return true;
      break;
    case 2:
      this.validNodeIndex = 0;
      this.functionNodeIndex = 1;
      this.isFunctionNode = Boolean(defineArguments[1].type === 'FunctionExpression') ? 1 : Boolean(defineArguments[1].type === 'ObjectExpression') ? 2 : 3;
      return true;
      break;
    case 1:
      this.validNodeIndex = -1;
      this.functionNodeIndex = 0;
      this.isFunctionNode = Boolean(defineArguments[0].type === 'FunctionExpression') ? 1 : Boolean(defineArguments[0].type === 'ObjectExpression') ? 2 : 3;
      return true;
      break;
    default:
      return false;
      break;
  }
};

/**
 * Given an AMD style define, get a map of dependencies
 * For example,
 *    define(['req1', 'req2'], function(Req1, Req1) {})
 * Produces:
 *    {'req1': Req1, 'req2': Req2}
 * @param {Object} node AST Node
 * @returns {Object} An object map of dependencies
 */
AMDNode.prototype.getDependencyMap = function(){
  var arrayDependencies = this.getArrayDependencies();
  var dependencyIdentifiers = this.getDependencyIdentifiers();
  return _.object(_.zip(arrayDependencies, dependencyIdentifiers));
};

/**
 * Get the dependencies from the array
 * @param {Object} node AST Node
 * @returns {String[]} A list of dependency strings
 */
AMDNode.prototype.getArrayDependencies = function(){
  // console.log('^^^^^^^^^^^^^^^^^^^^^');
  // console.log(this.validNodeIndex);
  // console.log(JSON.stringify(this.node,null,4));
  return _.map(this.node.expression.arguments[this.validNodeIndex].elements, function(element){
    return element.value;
  });
};

AMDNode.prototype.getArrayNode = function(){
  return this.node.expression.arguments[0];
};

AMDNode.prototype.getFunctionNode = function(){
  //   console.log('&&&&&&&&&&&&&&&&&&&&&');
  // console.log(this.functionNodeIndex);
  return this.node.expression.arguments[this.functionNodeIndex];
  
};

/**
 * Get the dependencies identifiers from the array
 * @param {Object} node AST Node
 * @returns {String[]} A list of dependency strings
 */
AMDNode.prototype.getDependencyIdentifiers = function(){
  return _.map(this.node.expression.arguments[this.functionNodeIndex].params, function(param){
    return param.name;
  });
};

module.exports = AMDNode;
