function processPostFix(tokens) {
	opperators = [
		'+',
		'-',
		'*',
		'/',
		'^'
	]

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
	return tokens
}

function infixToPostFix(infix) {
	presedence = {
		'+' : 1,
		'-' : 1,
		'*' : 2,
		'/' : 2,
		'^' : 3
	}

	posibleTokens = Object.keys(presedence)

	var tokens = tokenize(infix, posibleTokens)
	var stack = [];
	var postFix = [];
	tokens.forEach(function(token) {
		if (contains(presedence, token)) {
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
	});
	while (stack.length > 0) {
		postFix.push(stack.pop());
	}

	return postFix
}

function tokenize(input, possibleTokens) {
	var curIndex = 0;
	tokens = [];
	while (curIndex < input.length) {
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
		}
		var curTokenIndex = -1;
		for (var i = curIndex + 1; i <= input.length; i++) {
			var token = input.substring(curIndex, i);
			var newTokenIndex = possibleTokens.indexOf(token);
			if (newTokenIndex != -1 || (!isNaN(token.trim()) && token.trim().length != 0)) {
				curTokenIndex = i
			} else {
				break;
			}
		}
		if (curTokenIndex == -1) {
			curIndex++;
		} else {
			var token = input.substring(curIndex, curTokenIndex);
			if (!isNaN(token)) {
				tokens.push(parseFloat(token))
			} else {
				tokens.push(token);
			}
			curIndex = curTokenIndex
		}
		
	}
	return tokens;
}

/********* HELPER METHODS *********/

Array.prototype.peek = function() {
	if (this.length == 0) {
		return null;
	} else {
		return this[this.length -1]
	}
}

Object.prototype.keys = function() {
	var keys = [];
	for (var key in this) {
		if (this.hasOwnProperty(key)) {
			keys.push(key);
		}
	}
	return keys
}

function contains(map, charactor) {
	for (var key in map) {
		if (key == charactor) {
			return true;
		}
	}
	return false;
}