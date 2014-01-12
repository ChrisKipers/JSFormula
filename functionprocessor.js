var FunctionProcessor = (function() {
    var functions = {},
    	cache = {},
    	FUNC = 1,
		VAR = 2,
		LIT = 3,
		OPP = 4,
		cacheEnabled = true,
		presedence = {
			'+' : {
				presendence : 1,
				func: function (a, b) {
					return a + b;
				},
				arguments: 2,
				type: OPP
			},
			'-' : {
				presendence : 1,
				func: function (a, b) {
					return a - b;
				},
				arguments: 2,
				type: OPP
			},
			'*' : {
				presendence : 2,
				func: function (a, b) {
					return a * b;
				},
				arguments: 2,
				type: OPP
			},
			'/' : {
				presendence : 2,
				func: function (a, b) {
					return a / b;
				},
				arguments: 2,
				type: OPP
			},
			'^' : {
				presendence : 3,
				func: function (a, b) {
					return MATH.pow(a, b);
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
				} else if (firstChar === '(') {
					nextMatPosition = findClosingParan(curRemainingString);
					token = buildTreeFromFormula(curRemainingString.substring(1,nextMatPosition));
					tokens.push(token);
					curIndex += curIndex + nextMatPosition + 2;
				} else if (regexMatch = getFirstRegex(variableRegex, curRemainingString)) {
					stripedRegex = regexMatch.replace(variableOpen,'').replace(variableEnd,'');
					tokens.push({
						type: VAR,
						val: stripedRegex
					});
					curIndex = curIndex + 1 + regexMatch.length;
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
				} else if (regexMatch = getFirstRegex(opporatorRegex, curRemainingString)) {
					opperator = presedence[regexMatch];
					tokens.push(opperator);
					curIndex = curIndex + 1 + regexMatch.length;
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
						while (topOpperator && topOpperator.presedence >= curToken.presedence) {
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
		evalVar = function (variable, object) {
			var path = variable.split('.');
			var curObject = object;
			for (var i = 0, max = path.length; i < max; i++) {
				curObject = curObject[path[i]];
			}
			return curObject;
		},
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
		calculate = function(input, object) {
			var tree = buildTreeFromFormula(input);
			return evalTree(tree, object);
		},
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
			return this;
		},
		setVarDelimiter = function(open, close) {
			if (open && close) {
				variableOpen = open;
    			variableEnd = close;
    			variableRegex = new RegExp('^' + variableOpen + '.*?' + variableEnd);
			} else {
				variableRegex = null;
			}
		},
		setCacheEnabled = function(ce) {
			cacheEnabled = ce;
		}

	return {
		"setFunctions" : setFunctions,
		"calculate" : calculate,
		'setCacheEnabled' : setCacheEnabled
	};
}());