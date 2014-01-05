function FunctionProcessor(functionsParam) {
	var functions = functionsParam;

	var standardTokens = [
		'+',
		'-',
		'*',
		'/',
		'^'
	]

	this.getStandardTokens = function() {
		return standardTokens;
	}

	var presedence = {
		'+' : 1,
		'-' : 1,
		'*' : 2,
		'/' : 2,
		'^' : 3
	}

	this.getPresedence = function() {
		return presedence;
	}

	this.getFunctions = function(){
		return functions;
	}

	this.setFunctions = function(newFunctions) {
		functions = newFunctions;
	}
}

FunctionProcessor.prototype.evaluate = function(formula, object) {
	var allPosibleTokens = [];
	this.getStandardTokens().forEach(function(token){
		allPosibleTokens.push(token)
	})
	var funcKeys = Object.keys(this.getFunctions());
	funcKeys.forEach(function(key) {
		allPosibleTokens.push(key);
	})
	var objKeys = Object.keys(object);
	objKeys.forEach(function(key){
		allPosibleTokens.push(key);
	})


	var postfix = this.infixToPostFix(formula, allPosibleTokens, object);
	var result = this.processPostFix(postfix);
	return result[0][0];
}

FunctionProcessor.prototype.processPostFix = function(tokenBlocks) {
	var opperators = this.getStandardTokens();
	tokenBlocks.forEach(function(tokens){
		for (var i = 0; i < tokens.length; i++) {
			if (opperators.indexOf(tokens[i]) != -1) {
				var opperator = tokens[i];
				var firstOpperand = tokens[i - 2]
				var secondOpperand = tokens[i - 1]
				var calculated = null;
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
			}
		}
	})
	
	return tokenBlocks;
}

FunctionProcessor.prototype.tokenize = function(input, possibleTokens, object) {
	var functionMap = this.getFunctions();
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

			var subTokenBlocks = this.tokenize(input.substring(curIndex + 1, input.length), possibleTokens, functionMap);
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
			} else if (!FunctionProcessor.possibleMatch(token, possibleTokens)) {
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
			} else if(FunctionProcessor.contains(functionMap,token)) { //If the token is a function we perform extra processing
				var closingParamIndex = FunctionProcessor.findNextClosingChar(input, curTokenIndex + 1, '(', ')');
				//Process the inside of the parathesis to get the parameter values
				var parameters = this.processPostFix(this.infixToPostFix(input.substring(curTokenIndex + 1,closingParamIndex), possibleTokens, object));
				//Concatinate the parameter arrays into one array
				var concatinatedParameters = [];
				for (var i = 0; i < parameters.length; i++) {
					concatinatedParameters.push(parameters[i][0])
				}
				//Calculate the results of the function and push them onto the stack
				var result = functionMap[token].apply(this,concatinatedParameters);
				tokens.push(result);
				curTokenIndex = closingParamIndex;
			} else if(objKeys.indexOf(token) != -1) {
				var fieldData = this.processesFieldInfo(object,token,input, curTokenIndex);
				tokens.push(fieldData);
			} else {
				tokens.push(token);
			}
			curIndex = curTokenIndex
		}
	}
	allTokenBlocks.splice(0,0,tokens);
	return allTokenBlocks;
}

FunctionProcessor.prototype.infixToPostFix = function(infix, possibleTokens, object) {
	var postFixs = []
	var tokenBlocks = this.tokenize(infix, possibleTokens, object)
	var presedence = this.getPresedence()
	tokenBlocks.forEach(function(tokenBlock) {
		var stack = [];
		var postFix = [];
		tokenBlock.forEach(function(token){
			if (FunctionProcessor.contains(presedence, token)) {
				var peakChar = stack.peek()
				if (peakChar == null) {
					stack.push(token);
				} else {
					while (stack.peek() != null && presedence[stack.peek()] >= presedence[token]) {
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
}

/********* HELPER METHODS *********/

Array.prototype.peek = function() {
	if (this.length == 0) {
		return null;
	} else {
		return this[this.length -1]
	}
}

// Object.prototype.keys = function() {
// 	var keys = [];
// 	for (var key in this) {
// 		if (this.hasOwnProperty(key)) {
// 			keys.push(key);
// 		}
// 	}
// 	return keys
// }

FunctionProcessor.contains = function(map, charactor) {
	for (var key in map) {
		if (key == charactor) {
			return true;
		}
	}
	return false;
}

FunctionProcessor.findNextClosingChar= function(input, start,openChar,closingChar) {
	var numberOfOpen = 1;
	for (var i = start; i < input.length; i++) {
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
}

FunctionProcessor.possibleMatch = function(token, possibleTokens) {
	for (var i = 0; i < possibleTokens.length; i++) {
		if (possibleTokens[i].indexOf(token) != -1) {
			return true;
		}
	}
	return false;
}

FunctionProcessor.prototype.processesFieldInfo = function(object,token,input,end) {
	if (end + 1 < input.length && input[end] == '[') {
		var endingBracket = FunctionProcessor.findNextClosingChar(input, end + 1, '[', ']')
		var inside = input.substring(end + 1, end + endingBracket - 1);
		var newFp = new FunctionProcessor(this.getFunctions);
		var processedKey = newFp.evaluate(inside,object[token])
		return processedKey;
	} else {
		return object[token]
	}
}