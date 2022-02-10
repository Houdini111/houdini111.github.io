function load_svg(file_name) {
	if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '') {
		let fileFieldElem = document.createElement('input');
		fileFieldElem.type = 'file';
		document.getElementById("svgContainer").appendChild(fileFieldElem);
		fileFieldElem.addEventListener('change', () => {
			let files = fileFieldElem.files;
			if (files.length == 0) { return; }
			const file = files[0];
			let reader = new FileReader();
			reader.onload = (e) => {
				document.getElementById("svgContainer").innerHTML = reader.result;
			};
			reader.onerror = (e) => alert(e.target.error.name);
			reader.readAsText(file);
		});
		fileFieldElem.click();
	}
	else {
		file_name = 'assets/svg/' + file_name + '_gate_optimized.svg';
		xhr = new XMLHttpRequest();
		xhr.open('GET', file_name, false);
		// Following line is just to be on the safe side;
		// not needed if your server delivers SVG with correct MIME type
		xhr.overrideMimeType('image/svg+xml');
		xhr.onload = function (e) {
			// You might also want to check for xhr.readyState/xhr.status here
			let container = document.getElementById('svgContainer');
			container.innerHTML = '';
			container.appendChild(xhr.responseXML.documentElement);
		};
		xhr.send("");
	}
}