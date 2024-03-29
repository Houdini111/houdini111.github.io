let target_framerate = 60;
let target_frametime;

let debug_info_div;
let framerate_info_div;
let frametime_info_div;
let frametimes = [];
let previous_update_time;

let save_data;
let transitionings = [];
let transactionMaster;
let unlockMaster;
let resourceUpdater;


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
	init_mappings();
	init_unlocks();
	unlockMaster.load(save_data);
	init_transactions();
	resourceUpdater.updateAllResources(save_data);
	setup_next_main();
}

function init_mappings() {
	resourceUpdater = new ResourceUpdater();
	resourceUpdater.addMapping('transistors', 'transistor_count');
	resourceUpdater.addMapping('not_gates', 'not_gate_count');
	resourceUpdater.addMapping('and_gates', 'and_gate_count');
	resourceUpdater.addMapping('or_gates', 'or_gate_count');
	resourceUpdater.addMapping('xor_gates', 'xor_gate_count');
}

function init_unlocks() {
	unlockMaster = new UnlockMaster();
	unlockMaster.addUnlock([['transistors', 10]], function () {
		unhideTierRow('tier_row_0.5');
	});
}

function init_transactions() {
	transactionMaster = new TransactionMaster(save_data, resourceUpdater, unlockMaster);
	transactionMaster.add_transaction('transistor_add_button', null, [['transistors', 1]], null);
	transactionMaster.add_transaction('basic_gate_unlock_button', [['transistors', 20]], null, function() {
		hideTierRow('tier_row_0.5');
		unhideTierRow('tier_row_1');
	});
	transactionMaster.add_transaction('not_gate_add_button', [['transistors', not_gate_cost]], [['not_gates', 1]], null);
	transactionMaster.add_transaction('and_gate_add_button', [['transistors', and_gate_cost]], [['and_gates', 1]], null);
	transactionMaster.add_transaction('or_gate_add_button', [['transistors', or_gate_cost]], [['or_gates', 1]], null);
	transactionMaster.add_transaction('xor_gate_add_button', [['transistors', xor_gate_cost]], [['xor_gates', 1]], null);
}

function load_fixed_data_to_ui() {
	set_all_for_class('basic_gate_cost', basic_gate_cost);
	set_all_for_class('not_gate_cost', not_gate_cost);
	set_all_for_class('and_gate_cost', and_gate_cost);
	set_all_for_class('or_gate_cost', or_gate_cost);
	set_all_for_class('xor_gate_cost', xor_gate_cost);
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

function button_hold_click(event, method) {
	let eventOrigin = getEventTarget(event);
	transitionings.push(new Transition(eventOrigin, 'background-position-x', 350, 100, 0, function() { 
		if (method) { method(); } 
		button_hold_click(event, method); 
	}, EarlyEndEvents.MouseUp ));
}
