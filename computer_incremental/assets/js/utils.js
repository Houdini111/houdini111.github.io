const enumValue = (name) => Object.freeze({ toString: () => name });

function lerp(start, end, amount) {
	return ((1 - amount) * start) + (amount * end);
}

function setDisabled(elem, disable) {
	if (disable) {
		elem.classList.add('disabled');
	} else {
		elem.classList.remove('disabled');
	}
}

function now_ms() {
	return new Date().getTime();
}

function average_arr(array) {
	return array.reduce((a, b) => a + b) / array.length;
}

//from https://stackoverflow.com/a/10091011
function getEventTarget(event) {
	let targetElement = null;
	try {
		if (typeof event.target != "undefined") {
			targetElement = event.target;
		} else {
			targetElement = event.srcElement;
		}
		// just make sure this works as inteneded
		if (targetElement != null && targetElement.nodeType && targetElement.parentNode) {
			while (targetElement.nodeType == 3 && targetElement.parentNode != null) {
				targetElement = targetElement.parentNode;
			}
		}
	} catch (ex) { alert("getEventTarget failed: " + ex); }
	return targetElement;
};
//////////////