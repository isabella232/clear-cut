/**
 * Calculates the specificity of CSS selectors
 * http://www.w3.org/TR/css3-selectors/#specificity
 *
 * Returns an array of objects with the following properties:
 *  - selector: the input
 *  - specificity: e.g. 0,1,0,0
 */

var calculate = function(input) {
	var selectors,
		selector,
		i,
		len,
		results = [];

	// Separate input by commas
	selectors = input.split(',');

	for (i = 0, len = selectors.length; i < len; i += 1) {
		selector = selectors[i];
		if (selector.length > 0) {
			results.push(calculateSingle(selector));
		}
	}

	return results;
};

// Calculate the specificity for a selector by dividing it into simple selectors and counting them
var calculateSingle = function(input) {
	var selector = input,
		findMatch,
		typeCount = {
			'a': 0,
			'b': 0,
			'c': 0
		},
		// The following regular expressions assume that selectors matching the preceding regular expressions have been removed
		attributeRegex = /(\[[^\]]+\])/g,
		idRegex = /(#[^\s\+>~\.\[:]+)/g,
		classRegex = /(\.[^\s\+>~\.\[:]+)/g,
		pseudoElementRegex = /(::[^\s\+>~\.\[:]+|:first-line|:first-letter|:before|:after)/g,
		pseudoClassRegex = /(:[^\s\+>~\.\[:]+)/g,
		elementRegex = /([^\s\+>~\.\[:]+)/g;

	// Find matches for a regular expression in a string and push their details to parts
	// Type is "a" for IDs, "b" for classes, attributes and pseudo-classes and "c" for elements and pseudo-elements
	findMatch = function(regex, type) {
		var matches, i, len, match, index, length;
		if (regex.test(selector)) {
			matches = selector.match(regex);
			for (i = 0, len = matches.length; i < len; i += 1) {
				typeCount[type] += 1;
				match = matches[i];
				index = selector.indexOf(match);
				length = match.length;
				// Replace this simple selector with whitespace so it won't be counted in further simple selectors
				selector = selector.replace(match, Array(length + 1).join(' '));
			}
		}
	};

	// Remove the negation psuedo-class (:not) but leave its argument because specificity is calculated on its argument
	(function() {
		var regex = /:not\(([^\)]*)\)/g;
		if (regex.test(selector)) {
			selector = selector.replace(regex, '     $1 ');
		}
	}());

	// Remove anything after a left brace in case a user has pasted in a rule, not just a selector
	(function() {
		var regex = /{[^]*/gm,
			matches, i, len, match;
		if (regex.test(selector)) {
			matches = selector.match(regex);
			for (i = 0, len = matches.length; i < len; i += 1) {
				match = matches[i];
				selector = selector.replace(match, Array(match.length + 1).join(' '));
			}
		}
	}());

	// Add attribute selectors to parts collection (type b)
	findMatch(attributeRegex, 'b');

	// Add ID selectors to parts collection (type a)
	findMatch(idRegex, 'a');

	// Add class selectors to parts collection (type b)
	findMatch(classRegex, 'b');

	// Add pseudo-element selectors to parts collection (type c)
	findMatch(pseudoElementRegex, 'c');

	// Add pseudo-class selectors to parts collection (type b)
	findMatch(pseudoClassRegex, 'b');

	// Remove universal selector and separator characters
	selector = selector.replace(/[\*\s\+>~]/g, ' ');

	// Remove any stray dots or hashes which aren't attached to words
	// These may be present if the user is live-editing this selector
	selector = selector.replace(/[#\.]/g, ' ');

	// The only things left should be element selectors (type c)
	findMatch(elementRegex, 'c');

	return (typeCount.a * 100) + (typeCount.b * 10) + (typeCount.c * 1);
};

exports.calculate = calculate;
