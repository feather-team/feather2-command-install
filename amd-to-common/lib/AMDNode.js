var _ = require('underscore');

/**
 *
 * @param node
 * @constructor
 */
var AMDNode = function(node){
  this.node = node;
  this.validNodeIndex = 0;//dependencies定义的位置（define的第二个参数）
  this.functionNodeIndex = 1;//函数体定义的位置（define的第三个参数）
  this.isFunctionNode = 1; //1:function;2:object;3:factory4无
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

  if( !( (node.test.operator === '!==' && node.test.left && node.test.left.operator === 'typeof') || (node.test.operator === '&&' && node.test.left && node.test.left.operator === '===' && node.test.left.left.operator == 'typeof') ) ) {
    return false;
  }

  return Boolean( ( _.has(node.test.left, "argument") && (node.test.left.argument.name === 'exports' || node.test.left.argument.name === 'module') && node.test.right.value === 'undefined') || ( _.has(node.test.left.left, "argument") && ( node.test.left.left.argument.name === 'exports' || node.test.left.left.argument.name === 'module' || node.test.left.left.argument.name === 'module.exports') && node.test.left.right.value === 'object') ) ;
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

  if( _.has(node, "alternate") && _.has(node.alternate, "range") ){
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

  var defineArguments = this.node.expression.arguments;

  switch( defineArguments.length ){
    case 3:
      this.validNodeIndex = 1;
      this.functionNodeIndex = 2;
      this.isFunctionNode = Boolean(defineArguments[2].type === 'FunctionExpression') ? 1 : Boolean(defineArguments[2].type === 'ObjectExpression') ? 2 : Boolean(defineArguments[2].type === 'Identifier') ? 3 : 4;
      return true;
      break;
    case 2:
      if( defineArguments[0].type === 'ArrayExpression' ){
        this.validNodeIndex = 0;
        this.functionNodeIndex = 1;
        this.isFunctionNode = Boolean(defineArguments[1].type === 'FunctionExpression') ? 1 : Boolean(defineArguments[1].type === 'ObjectExpression') ? 2 : Boolean(defineArguments[1].type === 'Identifier') ? 3 : 4;
      }else{
        this.validNodeIndex = 1;
        this.functionNodeIndex = -1;
        this.isFunctionNode = 4;
      }
      return true;
      break;
    case 1:
      if( defineArguments[0].type === 'ArrayExpression' ){
        this.validNodeIndex = 0;
        this.functionNodeIndex = -1;
        this.isFunctionNode = 4;
      }else if( defineArguments[0].type  === 'ObjectExpression' ) {
        this.validNodeIndex = -1;
        this.functionNodeIndex = 0;
        this.isFunctionNode = 2
      }else if( defineArguments[0].type  === 'Identifier' ){
        this.validNodeIndex = -1;
        this.functionNodeIndex = 0;
        this.isFunctionNode = 3;
      }else if( defineArguments[0].type  === 'FunctionExpression' ){
        this.validNodeIndex = -1;
        this.functionNodeIndex = 0;
        this.isFunctionNode = 1;
      }
      return true;
      break;
    default:
      return false;
      break;
  }
};

/**获取依赖资源及其标识符的二维数组
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

/**获取依赖的资源名
 * Get the dependencies from the array
 * For example,
 *    define(['req1', 'req2'], function(Req1, Req1) {})
 * Produces:
 *    ['req1', 'req2']
 * @param {Object} node AST Node
 * @returns {String[]} A list of dependency strings
 */
AMDNode.prototype.getArrayDependencies = function(){
  if( this.validNodeIndex !=-1 ){
    if( _.has( this.node.expression.arguments[this.validNodeIndex], "elements") ){
      return _.map(this.node.expression.arguments[this.validNodeIndex].elements, function(element){
        return element.value;
      });
    }
  }

  return [];
};

AMDNode.prototype.getArrayNode = function(){
  if( this.validNodeIndex != -1){
      return this.node.expression.arguments[this.validNodeIndex]; 
  }else{
    return null;
  }
};

AMDNode.prototype.getFunctionNode = function(){
  if( this.functionNodeIndex != -1){
      return this.node.expression.arguments[this.functionNodeIndex];  
  }else{
    return null;
  }
  
};

/**获取依赖的资源名对应的标识符
 * Get the dependencies identifiers from the array
 * For example,
 *    define(['req1', 'req2'], function(Req1, Req1) {})
 * Produces:
 *    ["Req1", "Req1"]
 * @param {Object} node AST Node
 * @returns {String[]} A list of dependency strings
 */
AMDNode.prototype.getDependencyIdentifiers = function(){
  if( this.functionNodeIndex !=-1 &&  this.isFunctionNode == 1 ){
    return _.map(this.node.expression.arguments[this.functionNodeIndex].params, function(param){
      return param.name;
    });
  }

  return [];

};

module.exports = AMDNode;
