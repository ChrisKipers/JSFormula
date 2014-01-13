/*
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

/**
*	This is an object that has one method, noConflict. No conflict is used to return
*	a function that performs calculations and has function properties to set functions, enable/disable caching
*	and set the delimiters for variables
*
*/
var JSFormulaCalculator = (function() {
    var functions = {},
    	cache = {},
    	FUNC = 1,
		VAR = 2,
		LIT = 3,
		OPP = 4,
		cacheEnabled = true,
		precedence = {
			'+' : {
				precedence : 1,
				func: function (a, b) {
					return a + b;
				},
				arguments: 2,
				type: OPP
			},
			'-' : {
				precedence : 1,
				func: function (a, b) {
					return a - b;
				},
				arguments: 2,
				type: OPP
			},
			'*' : {
				precedence : 2,
				func: function (a, b) {
					return a * b;
				},
				arguments: 2,
				type: OPP
			},
			'/' : {
				precedence : 2,
				func: function (a, b) {
					return a / b;
				},
				arguments: 2,
				type: OPP
			},
			'^' : {
				precedence : 3,
				func: function (a, b) {
					return Math.pow(a, b);
				},
				arguments: 2,
				type: OPP
			}
		},
		variableOpen = '{',
		variableEnd = '}',
		variableRegex = new RegExp('^' + variableOpen + '.*?' + variableEnd),
		functionRegex = null,
		opporatorRegex = /^\+|^-|^\/|^\*|^\^/,
		/**
		*	Takes a formula and parses it into a token array
		*	
		*	@method tokenize
		*	@param {String} input The formula
		*	@return {Array} An array of tokens
		*/
		tokenize = function(input) {
			var curIndex = 0,
				tokens = [],
				token,
				regexMatch,
				curRemainingString,
				inputLen = input.length,
				firstChar,
				nextMatPosition,
				funcName,
				paramsUnparsed,
				params,
				stripFirstParam,
				opperator,
				stripedRegex,
				closingParan;

			while (curIndex < inputLen) {
				curRemainingString = input.substring(curIndex).trim();
				//This part of the code check for strings
				firstChar = input.substring(curIndex, curIndex + 1);
				//Handle cases were token is going to be a string
				if (firstChar === '"' || firstChar === "'") {
					nextMatPosition = input.indexOf(firstChar,curIndex + 1);
					if (nextMatPosition == -1) {
						throw "Quote miss match";
					}
					tokens.push({
						type: LIT,
						val : input.substring(curIndex,curIndex + nextMatPosition + 2)
					});
					curIndex += curIndex + nextMatPosition + 2;
				//Handles cases were formula is wrapped in parenthis to override precedence
				} else if (firstChar === '(') {
					nextMatPosition = findClosingParan(curRemainingString);
					token = buildTreeFromFormula(curRemainingString.substring(1,nextMatPosition));
					tokens.push(token);
					curIndex = curIndex + nextMatPosition + 2;
				//Handles cases were token is a variable
				} else if (regexMatch = getFirstRegex(variableRegex, curRemainingString)) {
					stripedRegex = regexMatch.replace(variableOpen,'').replace(variableEnd,'');
					tokens.push({
						type: VAR,
						val: stripedRegex
					});
					curIndex = curIndex + 1 + regexMatch.length;
				//Handles cases were token is a function
				} else if (regexMatch = getFirstRegex(functionRegex,curRemainingString)) {
					nextMatPosition = regexMatch.indexOf('(');
					funcName = regexMatch.substring(0,nextMatPosition);
					stripFirstParam = regexMatch.substring(nextMatPosition);
					closingParan = findClosingParan(curRemainingString);
					//paramsUnparsed = findParameters(stripFirstParam.substring(1, stripFirstParam.length - 1));
					paramsUnparsed = findParameters(curRemainingString.substring(nextMatPosition + 1,closingParan + 1));
					params = [];
					for (var i = 0, max = paramsUnparsed.length; i < max; i++) {
						var newParam = 
						params.push(buildTreeFromFormula(paramsUnparsed[i]));
					}
					tokens.push({
						type: FUNC,
						func: functions[funcName],
						params: params
					});
					curIndex = curIndex + 2 + closingParan;
				//Handles cases were token is an opperator
				} else if (regexMatch = getFirstRegex(opporatorRegex, curRemainingString)) {
					//Handle negation use cases
					if (regexMatch == '-') {
						if (tokens.length == 0 || tokens[tokens.length - 1].type === OPP) {
							nextMatPosition = curRemainingString.indexOf(' ');
							if (nextMatPosition === -1) {
								nextMatPosition = curRemainingString.length;
							}
							try {
								tokens.push({
									type: LIT,
									val: Number(curRemainingString.substring(0,nextMatPosition))
								});
								curIndex = curIndex + 1 + nextMatPosition;
							} catch (err) {
								throw 'Invalid use of -; If you want to negate a variable or function times it by -1';
							}
							continue;
						}
					}
					opperator = precedence[regexMatch];
					tokens.push(opperator);
					curIndex = curIndex + 1 + regexMatch.length;
				//Handles cases were the token is a number litteral
				} else {
					nextMatPosition = curRemainingString.indexOf(' ');
					if (nextMatPosition === -1) {
						token = curRemainingString;
						nextMatPosition = token.length;
					} else {
						token = curRemainingString.substring(0, nextMatPosition);
					}
					
					if (isNaN(token)) {
						throw "This is not an acceptable token: " + token;
					}
					tokens.push({
						type: LIT,
						val: new Number(token)
					});
					curIndex = curIndex + 1 + nextMatPosition;
				}
			}
			return tokens;
		},
		/**
		*	Returns the first Regex match or null if none is found
		*	
		*	@method getFirstRegex
		*	@param {RegExp} regex Regular expression to compare against the string
		*	@param {String} string The string to find a match in
		*	@return {String} The first regex match or null if none is found
		*/
		getFirstRegex = function(regex,string) {
			if (regex) {
				var results = regex.exec(string);
				if(results) {
					return results[0];
				} else {
					return results;
				}
			} else {
				return null;
			}
			
		},
		/**
		*	Returns an array of formulas inside a comma delimited parentheses
		*	
		*	@method findParameters
		*	@param {String} input Contents inside of parentheses including wrapping parentheses
		*	@return {Array} Array of formulas
		*/
		findParameters = function(input) {
			var curPos = 0,
				params = [],
				unclosedParams = 0,
				curChar,
				len = input.length;
			while(curPos < len) {
				curChar = input[curPos];
				if (curChar === '(') {
					unclosedParams++;
					curPos++;
				} else if(curChar === ')') {
					unclosedParams--;
					if (unclosedParams == -1) {
						input = input.substring(0, curPos);
						break;
					}
					curPos++;
				} else if (curChar === ',' && unclosedParams == 0) {
					params.push(input.substring(0,curPos));
					input = input.substring(curPos + 1);
					len = input.length;
					curPos = 0;
				} else {
					curPos++;
				}
			}
			params.push(input);
			return params;
		},
		/**
		*	Returns the index of the closing parentheses in a string
		*	
		*	@method findClosingParan
		*	@param {String} input Contents inside of parentheses including wrapping parentheses
		*	@return {Integer} Index of the closing parenthesis
		*/
		findClosingParan = function(input) {
			var numberOfUnclosed = 0,
				currentChar;
			for (var i = 0, max = input.length; i < max; i++) {
				currentChar = input[i];
				if (currentChar === '(') {
					numberOfUnclosed++;
				} else if (currentChar === ')') {
					numberOfUnclosed--;
					if (numberOfUnclosed === 0) {
						return i;
					}
				}
			}
			throw "No Closing Parentheses found";
		},
		/**
		*	Reorders the tokens into postfix based on the precedence of the operators
		*	
		*	@method infixToPostFix
		*	@param {Array} tokens An array of tokens
		*	@return {Array} The tokens reorder based on the precedence of the operators
		*/
		infixToPostFix = function(tokens) {
			var stack =[],
				postFix = [],
				curToken,
				topOpperator,
				curStackLength;
			for (var i = 0, max = tokens.length; i < max; i++) {
				curToken = tokens[i];
				if (curToken.type !== OPP) {
					postFix.push(curToken);
				} else {
					if (stack.length === 0) {
						stack.push(curToken);
					} else {
						topOpperator = stack[stack.length -1];
						while (topOpperator && topOpperator.precedence >= curToken.precedence) {
							postFix.push(stack.pop());
							curStackLength = stack.length;
							if (curStackLength > 0) {
								topOpperator = stack[stack.length -1];
							} else {
								topOpperator = null;
							}
						}
						stack.push(curToken);
					}
				}
			}
			while(curToken = stack.pop()) {
				postFix.push(curToken);
			}
			return postFix;
		},
		/**
		*	Builds a tree with the tokens.
		*	
		*	@method buildTree
		*	@param {Array} postFix An array of tokens
		*	@return {Object} A tree that can be evaluated by the evalTree method
		*/
		buildTree = function(postFix) {
			var i = 0,
				max = postFix.length,
				postFix = postFix.slice(0), //Copy it as to not modify the original array
				currentToken,
				numArgs,
				params; 

			while (i < max) {
				currentToken = postFix[i];
				if (currentToken.type !== OPP) {
					i++;
				} else {
					params = [];
					numArgs = currentToken.arguments;
					while (numArgs > 0) {
						try {
							params.push(postFix[i - numArgs]);
							numArgs--;
						} catch (err) {
							throw 'Malformed Expression';
						}
					}
					postFix.splice(i - currentToken.arguments, currentToken.arguments + 1, {
						type: FUNC,
						params: params,
						func: currentToken.func
					});
					i = i - 1;
					max = postFix.length;
				}
			}
			if (postFix.length !== 1) {
				throw 'Malformed Expression';
			}
			return postFix[0];
		},
		/**
		*	Evaluates a tree with a given object
		*	
		*	@method evalTree
		*	@param {Object} tree The tree to be evaluated
		*	@param {Object} object The object that will be used to populate the variables
		*	@return {Object} The result of the tree evaluation with the given object
		*/
		evalTree = function(tree, object) {
			if (tree.type === FUNC) {
				var paramResults = [];
				for (var i = 0, max = tree.params.length; i < max; i++) {
					paramResults.push(evalTree(tree.params[i],object));
				}
				return tree.func.apply(this, paramResults);
			} else if (tree.type === VAR) {
				return evalVar(tree.val, object);
			} else if (tree.type === LIT) {
				return tree.val;
			}
		},
		/**
		*	Determines the value of a variable for the given object
		*	
		*	@method evalVar
		*	@param {String} variable A string representing a variable Ex: x.y
		*	@param {Object} object The object that the variable will be evaluated against
		*	@return {Object} Value of the variable in the provided object
		*/
		evalVar = function (variable, object) {
			var path = variable.split('.');
			var curObject = object;
			for (var i = 0, max = path.length; i < max; i++) {
				curObject = curObject[path[i]];
			}
			return curObject;
		},
		/**
		*	A wrapper method that handles tokenizing the input, rearranging the tokens into postfix,
		*	and building the tree. It also handles caching trees based on the input if the caching feature is enabled (the default)
		*	
		*	@method buildTreeFromFormula
		*	@param {String} input The formula used to build the tree
		*	@return {Object} A tree that can be evaluated by the evalTree method
		*/
		buildTreeFromFormula = function(input) {
			var tree,
				tokens,
				postFix;

			if (cacheEnabled) {
				if(tree = cache[input]) {
					return tree;
				}
			}

			if (!tree) {
				tokens = tokenize(input);
				postFix = infixToPostFix(tokens);
				tree = buildTree(postFix);
				if (cacheEnabled) {
					cache[input] = tree;
				}
				return tree;
			}
		},
		/**
		*	A wrapper method that retreves a tree for a given formula and evaluates it against
		*	the given object. This is the functions that gets called by _eval
		*
		*	@method calculate
		*	@param {String} input The formula used to retrieve the tree
		*	@param {string} object The object that will be used to populate the variables
		*	@return {Object} The result of the formula with the object used to populate variable values
		*/
		calculate = function(input, object) {
			var tree = buildTreeFromFormula(input);
			return evalTree(tree, object);
		},
		/**
		*	Sets the functions that can be used in the formulas
		*
		*	@method setFunctions
		*	@param {Object} newFunctions A map of function names to functions
		*/
		setFunctions = function(newFunctions) {
			var functionRegexs = [],
				regexString;
			functions = newFunctions;
			for (var prop in functions) {
				if (functions.hasOwnProperty(prop)) {
					functionRegexs.push('^' + prop + '\\(');
				}
			}
			if (!functionRegexs) {
				functionRegex = null;
			} else {
				regexString = functionRegexs.join('|');
				functionRegex = new RegExp(regexString);
			}
		},
		/**
		*	Sets the strings that will be used to wrap a variable for parsing
		*
		*	@method setVarDelimiter
		*	@param {String} open The string that signifies the start of a variable
		*	@param {String} close The string that signifies the end of a variable
		*/
		setVarDelimiter = function(open, close) {
			if (open && close) {
				variableOpen = open;
    			variableEnd = close;
    			variableRegex = new RegExp('^' + variableOpen + '.*?' + variableEnd);
			} else {
				variableRegex = null;
			}
		},
		/**
		*	Sets whether caching is enabled (default) or disabled
		*
		*	@method setCacheEnabled
		*	@param {Boolean} ce Caching enabled
		*/
		setCacheEnabled = function(ce) {
			cacheEnabled = ce;
		},
		/**
		*	Builds an executable function which accepts an object as a parameter
		*
		*	@method buildFunction
		*	@param {String} formula The formula that will be evaluated
		*	@return {Function} an executable function which accepts an object as a parameter
		*/
		buildFunction = function(formula) {
			var tree = buildTreeFromFormula(formula);
			var newFunction = function(object) {
				return evalTree(tree, object);
			};
			return newFunction;
		}

		//Add methods to the calculate method, since we are returning the function calculate,
		//So that it can behave like jQuery
		calculate.setFunctions = setFunctions;
		calculate.setCacheEnabled = setCacheEnabled;
		calculate.getFunction = buildFunction;
		return {
			noConflict: function() {
				return calculate
			}
		};
}());

//Set the global variable _eval if it has a false value
var _eval = _eval || JSFormulaCalculator.noConflict();