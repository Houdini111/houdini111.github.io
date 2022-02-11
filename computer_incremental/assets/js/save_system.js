class SaveData {
	constructor() {
		this.transistors = 0;
		this.not_gates = 0;
		this.and_gates = 0;
		this.or_gates = 0;
		this.xor_gates = 0;
	}

	getResourceFromPath(pathString) {
		if (pathString == null) {
			return null;
		}
		let splitPath = pathString.split('.');
		let resource = save_data;
		let nextPath = splitPath.shift();
		do {
			resource = resource[nextPath];
			nextPath = splitPath.shift();
		} while (nextPath != null);
		return resource;
	}

	changeResourceAtPath(pathString, amount) {
		if (pathString == null || amount == 0) {
			return;
		}
		let splitPath = pathString.split('.');
		if (splitPath.length < 1) {
			return;
		}
		let resource = save_data;
		while (splitPath.length > 1) {
			let nextPath = splitPath.shift();
			resource = resource[nextPath];
		}
		resource[splitPath[0]] += amount;
    }
}