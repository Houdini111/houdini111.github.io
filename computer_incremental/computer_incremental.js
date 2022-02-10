let target_framerate = 60;
let target_frametime = -1;

let debug_info_div;
let framerate_info_div;
let frametime_info_div;
let frametimes = [];
let previous_update_time;

let save_data;
let transitionings = [];

const not_gate_cost = 1;
const and_gate_cost = 2;
const or_gate_cost = 2;
const xor_gate_cost = 6;


window.onload = function() {
	init();
}

function init() {
	target_frametime = 1000/target_framerate;
	
	debug_info_div = document.getElementById('debug_info');
	framerate_info_div = document.getElementById('framerate_info');
	frametime_info_div = document.getElementById('frametime_info');
	
	window.addEventListener('mouseup', function(e) {
		earlyEndTransitions(EarlyEndEvents.MouseUp);
	});
	
	previous_update_time = now_ms();
	
	load();
}

function load() {
	let existing_save = false;
	if (existing_save) {
		
	} else {
		save_data = new SaveData();
	}
	load_fixed_data_to_ui();
	load_data_to_ui();
	setup_next_main();
}

function load_fixed_data_to_ui() {
	set_all_for_class('not_gate_cost', not_gate_cost);
	set_all_for_class('and_gate_cost', and_gate_cost);
	set_all_for_class('or_gate_cost', or_gate_cost);
	set_all_for_class('xor_gate_cost', xor_gate_cost);
}

function load_data_to_ui() {
	set_all_for_class('transistor_count', save_data.transistors);
	check_transistor_costs();
}

function load_svg(file_name) {
	debugger;
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
				document.getElementById("svgContainer").innerHTML = reader.result; //.appendChild(reader.result);
			};
			reader.onerror = (e) => alert(e.target.error.name);
			reader.readAsText(file);
		});
		fileFieldElem.click();
	}
	else {
		file_name = file_name + '_gate_optimized.svg';
		xhr = new XMLHttpRequest();
		xhr.open('GET', file_name, false);
		// Following line is just to be on the safe side;
		// not needed if your server delivers SVG with correct MIME type
		xhr.overrideMimeType('image/svg+xml');
		xhr.onload = function(e) {
		  // You might also want to check for xhr.readyState/xhr.status here
		  let container = document.getElementById('svgContainer');
		  container.innerHTML = '';
		  container.appendChild(xhr.responseXML.documentElement);
		};
		xhr.send("");
	}
}

function set_all_for_class(className, value) {
	const elems = document.getElementsByClassName(className);
	if (elems) {
		for (const elem of elems) {
			elem.innerHTML = value;
		}
	}
}

function main() {
	const now_time = now_ms();
	const dt = now_time - previous_update_time;
	previous_update_time = now_time;
	
	update_transitions(dt);
	update_framerate_info(dt);
	
	setup_next_main();
}

function update_transitions(dt) {
	if (transitionings && transitionings.length > 0) {
		for (let i = transitionings.length - 1; i >= 0; i--) {
			const transition = transitionings[i];
			transition.progress += dt;
			if (transition.progress >= transition.duration) {
				transition.progress = transition.duration;
				if (transition.onCompletion) {
					transition.onCompletion();
				}
				transitionings.splice(i, 1);
			}
			const lerped = lerp(transition.minValue, transition.maxValue, transition.progress/transition.duration);
			setTransitionValue(transition.target, transition.property, lerped);
		}
	}
}

function earlyEndTransitions(earlyEndType) {
	if (transitionings && transitionings.length > 0) {
		for (let i = transitionings.length - 1; i >= 0; i--) {
			const transition = transitionings[i];
			if (transition.earlyEnd == earlyEndType) {
				transitionings.splice(i, 1);
				setTransitionValue(transition.target, transition.property, transition.maxValue);
			}
		}
	}
}

function setTransitionValue(target, property, value) {
	if (property === 'background-position' || property === 'background-position-x' || property === 'background-position-y') {
		target.style[property] = value+'%';
	} else {
		target.style[property] = value;
	}
}



function setup_next_main() {
	setTimeout(main, target_frametime);
}

function now_ms() {
	return new Date().getTime();
}

function average_arr(array) {
	return array.reduce((a, b) => a + b) / array.length;
}

function update_framerate_info(dt) {
	const update_time = now_ms() - previous_update_time;
	frametimes.push(dt);
	if (frametimes.length > 100) {
		frametimes.shift();
	}
	const avg_frametime = average_arr(frametimes).toFixed(3);
	const avg_framerate = (1000/avg_frametime).toFixed(0);
	framerate_info_div.innerHTML = '' + avg_framerate + ' / ' + target_framerate + ' (' + (100*avg_framerate/target_framerate).toFixed(2) + '%)';
	frametime_info_div.innerHTML = avg_frametime + 'ms | ' + update_time + 'ms';
}


function button_hold_click(event, method) {
	let eventOrigin = getEventTarget(event);
	/*
	if (eventOrigin) {
		eventOrigin.classList.add('clicked');
	}
	*/
	//let onComplete = null;
	transitionings.push(new Transition(eventOrigin, 'background-position-x', 350, 100, 0, function() { 
		if (method) { method(); } 
		button_hold_click(event, method); 
	}, EarlyEndEvents.MouseUp ));
	/*
	if (method) {
		setTimeout(function() { 
			method(); 
			//eventOrigin.classList.remove('clicked');
			//eventOrigin.classList.add('clicked');
			//button_hold_click(event, method); 
		}, 350);
	}
	*/
}

function transistor_add() {
	save_data.transistors++;
	set_all_for_class('transistor_count', save_data.transistors);
	check_transistor_costs();
}

function not_gate_add() {
	if (save_data.transistors >= not_gate_cost) {
		save_data.transistors -= not_gate_cost;
		save_data.not_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('not_gate_count', save_data.not_gates);
		check_transistor_costs();
		check_not_gate_counts();
	}
}

function and_gate_add() {
	if (save_data.transistors >= and_gate_cost) {
		save_data.transistors -= and_gate_cost;
		save_data.and_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('and_gate_count', save_data.and_gates);
		check_transistor_costs();
		check_and_gate_counts();
	}
}

function or_gate_add() {
	if (save_data.transistors >= or_gate_cost) {
		save_data.transistors -= or_gate_cost;
		save_data.or_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('or_gate_count', save_data.or_gates);
		check_transistor_costs();
		check_or_gate_counts();
	}
}

function xor_gate_add() {
	if (save_data.transistors >= xor_gate_cost) {
		save_data.transistors -= xor_gate_cost;
		save_data.xor_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('xor_gate_count', save_data.xor_gates);
		check_transistor_costs();
		check_xor_gate_counts();
	}
}

function check_transistor_costs() {
	setDisabled(document.getElementById('not_gate_add_button'), save_data.transistors < not_gate_cost);
	setDisabled(document.getElementById('and_gate_add_button'), save_data.transistors < and_gate_cost);
	setDisabled(document.getElementById('or_gate_add_button'), save_data.transistors < or_gate_cost);
	setDisabled(document.getElementById('xor_gate_add_button'), save_data.transistors < xor_gate_cost);
}

function check_not_gate_counts() {
	
}

function check_and_gate_counts() {
	
}

function check_or_gate_counts() {
	
}

function check_xor_gate_counts() {
	
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
 


class SaveData {
	constructor() {
		this.transistors = 0;
		this.not_gates = 0;
		this.and_gates = 0;
		this.or_gates = 0;
		this.xor_gates = 0;
	}
}

const enumValue = (name) => Object.freeze({toString: () => name});

const EarlyEndEvents = Object.freeze({ 
	MouseUp: enumValue("EarlyEndEvents.MouseUp")
});

class Transition {
	constructor(target, property, duration, minValue, maxValue, onCompletion, earlyEnd) {
		this.target = target;
		this.property = property;
		this.duration = duration;
		this.progress = 0;
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.onCompletion = onCompletion;
		this.earlyEnd = earlyEnd;
	}
}