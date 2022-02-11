const enumValue = (name) => Object.freeze({ toString: () => name });

function lerp(start, end, amount) {
	return ((1 - amount) * start) + (amount * end);
}

function setDisabled(elem) {
	elem.classList.add('disabled');
}

function setEnabled(elem) {
	elem.classList.remove('disabled');
}

function isDisabled(elem) {
	return elem.classList.contains('disabled');
}

function now_ms() {
	return new Date().getTime();
}

function average_arr(array) {
	return array.reduce((a, b) => a + b) / array.length;
}

function safe_push(obj, key, value) {
	let arr = obj[key];
	if (arr == null) {
		arr = [];
		obj[key] = arr;
	}
	arr.push(value);
}

function getNestedPropertyValue(obj, propertyList) {
	let propertyListCopy = [...propertyList];
	if (propertyListCopy == null) {
		return null;
	} else if (!Array.isArray(propertyListCopy)) {
		return obj[propertyListCopy];
	} else {
		let nextProperty = propertyListCopy.shift();
		if (propertyListCopy.length == 0) {
			return obj[nextProperty];
		} else {
			return this.getNestedPropertyValue(obj[nextProperty], propertyListCopy);
		}
	}
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