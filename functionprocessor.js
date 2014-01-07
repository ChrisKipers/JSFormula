var FunctionProcessor = (function() {
    var functions = {},
		presedence = {
			'+' : 1,
			'-' : 1,
			'*' : 2,
			'/' : 2,
			'^' : 3
		},
		standardTokens = [
			'+',
			'-',
			'*',
			'/',
			'^'
		],
		tokenize = function(input, possibleTokens, object) {
			var objKeys = Object.keys(object);
			var curIndex = 0;
			var tokens = [];
			var allTokenBlocks = [];
			while (curIndex < input.length) {
				//This part of the code check for strings
				var firstChar = input.substring(curIndex, curIndex + 1);
				if (firstChar == '"' || firstChar == "'") {
					var remanderString = input.substring(curIndex + 1, input.length);
					var nextQuotePosition = remanderString.indexOf(firstChar)
					if (nextQuotePosition == -1) {
						throw "Quote miss match";
					} else {
						tokens.push(input.substring(curIndex,curIndex + nextQuotePosition + 2));
						curIndex += curIndex + nextQuotePosition + 2;
						continue;
					}
				} else if(firstChar == ',') { //This part of the code check for commas

					var subTokenBlocks = tokenize(input.substring(curIndex + 1, input.length), possibleTokens, functions);
					subTokenBlocks.forEach(function(tokenBlock) {
						allTokenBlocks.push(tokenBlock)
					});
					break;
				}
				//If the first character is not a quote or a comma we then determine what token it is
				var curTokenIndex = -1;
				for (var i = curIndex + 1; i <= input.length; i++) {
					var token = input.substring(curIndex, i);
					var newTokenIndex = possibleTokens.indexOf(token);
					if (newTokenIndex != -1 || (!isNaN(token.trim()) && token.trim().length != 0)) {
						curTokenIndex = i
					} else if (!possibleMatch(token, possibleTokens)) {
						break;
					}
				}

				//If the value is not a token we just continue silently
				if (curTokenIndex == -1) {
					curIndex++;
				} else {
					var token = input.substring(curIndex, curTokenIndex);
					//If the token is a number we cast it to a number and push it to the token stack
					if (!isNaN(token)) {
						tokens.push(parseFloat(token))
					} else if(contains(functions,token)) { //If the token is a function we perform extra processing
						var closingParamIndex = findNextClosingChar(input, curTokenIndex + 1, '(', ')');
						//Process the inside of the parathesis to get the parameter values
						var parameters = processPostFix(infixToPostFix(input.substring(curTokenIndex + 1,closingParamIndex), possibleTokens, object));
						//Concatinate the parameter arrays into one array
						var concatinatedParameters = [];
						for (var i = 0; i < parameters.length; i++) {
							concatinatedParameters.push(parameters[i][0])
						}
						//Calculate the results of the function and push them onto the stack
						var result = functions[token].apply(this,concatinatedParameters);
						tokens.push(result);
						curTokenIndex = closingParamIndex;
					} else if(objKeys.indexOf(token) != -1) {
						var fieldData = processesFieldInfo(object,token,input, curTokenIndex);
						tokens.push(fieldData);
					} else {
						tokens.push(token);
					}
					curIndex = curTokenIndex
				}
			}
			allTokenBlocks.splice(0,0,tokens);
			return allTokenBlocks;
		},
		infixToPostFix = function(infix, possibleTokens, object) {
			var postFixs = [],
				tokenBlocks = tokenize(infix, possibleTokens, object);
			tokenBlocks.forEach(function(tokenBlock) {
				var stack = [],
					postFix = [];
				tokenBlock.forEach(function(token) {
					if (contains(presedence, token)) {
						var peakChar = peek(stack)
						if (peakChar == null) {
							stack.push(token);
						} else {
							while (peek(stack) != null && presedence[peek(stack)] >= presedence[token]) {
								postFix.push(stack.pop());
							}
							stack.push(token)
						}
					} else {
						postFix.push(token);
					}
				})
				while (stack.length > 0) {
					postFix.push(stack.pop());
				}
				postFixs.push(postFix);
			});
			return postFixs
		},
		processPostFix = function(tokenBlocks) {
			tokenBlocks.forEach(function(tokens){
				for (var i = 0; i < tokens.length; i++) {
					if (standardTokens.indexOf(tokens[i]) != -1) {
						(function(){
							var opperator = tokens[i],
								firstOpperand = tokens[i - 2],
								secondOpperand = tokens[i - 1],
								calculated;
							if (opperator == '+') {
								calculated = firstOpperand + secondOpperand;
							} else if (opperator == '-') {
								calculated = firstOpperand - secondOpperand;
							} else if (opperator == '*') {
								calculated = firstOpperand * secondOpperand;
							} else if (opperator == '/') {
								calculated = firstOpperand / secondOpperand;
							} else if (opperator == '^') {
								calculated = Math.pow(firstOpperand,secondOpperand);
							}
							tokens.splice(i - 2, 3, calculated);
							i = i - 2
						}());
					}
				}
			})
			
			return tokenBlocks;
		},
		evaluate = function(formula, object) {
			object = object ? object : {}
			var allPosibleTokens = [],
				funcKeys = Object.keys(functions),
				objKeys = Object.keys(object),
				postfix;

			standardTokens.forEach(function(token){
				allPosibleTokens.push(token)
			});
			funcKeys.forEach(function(key) {
				allPosibleTokens.push(key);
			});
			objKeys.forEach(function(key){
				allPosibleTokens.push(key);
			});
			postfix = infixToPostFix(formula, allPosibleTokens, object);
			return processPostFix(postfix)[0][0];
		},
		setFunctions = function(newFunctions) {
			functions = newFunctions;
			return this;
		},
		contains = function(map, charactor) {
			return Object.keys(map).indexOf(charactor) != -1;
		},
		findNextClosingChar= function(input, start,openChar,closingChar) {
			var numberOfOpen = 1;
			for (var i = start, max = input.length; i < max; i++) {
				if (input[i] == openChar) {
					numberOfOpen++;
				} else if (input[i] == closingChar) {
					numberOfOpen--;
					if (numberOfOpen == 0) {
						return i;
					}
				}
			}
			throw "No closing parameter found";
		},
		possibleMatch = function(token, possibleTokens) {
			for (var i = 0, max = possibleTokens.length; i < max; i++) {
				if (possibleTokens[i].indexOf(token) != -1) {
					return true;
				}
			}
			return false;
		},
		processesFieldInfo = function(object,token,input,end) {
			var max = input.length,
				endingBracket,
				inside,
				processedKey;

			if (end + 1 < max && input[end] == '[') {
				endingBracket = findNextClosingChar(input, end + 1, '[', ']')
				inside = input.substring(end + 1, end + endingBracket - 1);
				processedKey = evaluate(inside,object[token])
				return processedKey;
			} else {
				return object[token]
			}
		},
		peek = function(array) {
			if (array.length == 0) {
				return null;
			} else {
				return array[array.length -1]
			}
		}

	return {
		"setFunctions" : setFunctions,
		"evaluate" : evaluate
	};
}());