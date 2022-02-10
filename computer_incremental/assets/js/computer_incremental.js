let target_framerate = 60;
let target_frametime = -1;

let debug_info_div;
let framerate_info_div;
let frametime_info_div;
let frametimes = [];
let previous_update_time;

let save_data;
let transitionings = [];


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

	init_transactions();
	
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

function init_transactions() {
	//TODO: Automate the setting of classes and the checking of costs via associating a transaction with a button
	let transactions = [];
	let transistor_transaction = new Transaction(null, null, function () {
		save_data.transistors++;
		set_all_for_class('transistor_count', save_data.transistors);
		check_transistor_costs();
	});
	transactions.push(transistor_transaction);
	add_button_hold_transaction('transistor_add_button', transistor_transaction);
	let not_transaction = new Transaction('transistors', not_gate_cost, function () {
		save_data.not_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('not_gate_count', save_data.not_gates);
		check_transistor_costs();
		check_not_gate_counts();
	});
	transactions.push(not_transaction);
	add_button_hold_transaction('not_gate_add_button', not_transaction);
	let and_transaction = new Transaction('transistors', and_gate_cost, function () {
		save_data.and_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('and_gate_count', save_data.and_gates);
		check_transistor_costs();
		check_and_gate_counts();
	});
	add_button_hold_transaction('and_gate_add_button', and_transaction);
	transactions.push(and_transaction);
	let or_transaction = new Transaction('transistors', or_gate_cost, function () {
		save_data.or_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('or_gate_count', save_data.or_gates);
		check_transistor_costs();
		check_or_gate_counts();
	});
	add_button_hold_transaction('or_gate_add_button', or_transaction);
	transactions.push(or_transaction);
	let xor_transaction = new Transaction('transistors', xor_gate_cost, function () {
		save_data.xor_gates++;
		set_all_for_class('transistor_count', save_data.transistors);
		set_all_for_class('xor_gate_count', save_data.xor_gates);
		check_transistor_costs();
		check_xor_gate_counts();
	});
	transactions.push(xor_transaction);
	add_button_hold_transaction('xor_gate_add_button', xor_transaction);
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

function setup_next_main() {
	setTimeout(main, target_frametime);
}

function update_framerate_info(dt) {
	const update_time = now_ms() - previous_update_time;
	frametimes.push(dt);
	if (frametimes.length > 100) {
		frametimes.shift();
	}
	const avg_frametime = average_arr(frametimes).toFixed(3);
	const avg_framerate = (1000/avg_frametime).toFixed(1);
	framerate_info_div.innerHTML = '' + avg_framerate + ' / ' + target_framerate + ' (' + (100*avg_framerate/target_framerate).toFixed(2) + '%)';
	frametime_info_div.innerHTML = 'Avg frametime: ' + avg_frametime + 'ms<br/>Last update length: ' + update_time + 'ms';
}

function add_button_hold_transaction(elemId, transaction) {
	let elem = document.getElementById(elemId);
	if (elem) {
		elem.addEventListener('mousedown', function (event) {
			button_hold_click(event, function () {
				transaction.attempt(save_data);
			})
		});
    }
}

function button_hold_click(event, method) {
	let eventOrigin = getEventTarget(event);
	transitionings.push(new Transition(eventOrigin, 'background-position-x', 350, 100, 0, function() { 
		if (method) { method(); } 
		button_hold_click(event, method); 
	}, EarlyEndEvents.MouseUp ));
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