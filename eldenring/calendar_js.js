const ROW_COUNT = 17;
const COLUMN_COUNT = 55;
const special_days = [ 
	{ id: "annoucement", date: "2019-06-11" }, //Not the right date but it'll make my work easier
	{ id: "leak", date: "2021-03-01" }, 
	{ id: "reveal", date: "2021-06-10" }, 
	{ id: "release", date: "2022-01-20" }
];

window.onload = function() {
	const start = moment("2019-06-10", "YYYY-MM-DD");
	const today = moment();
	const days_til_now = today.diff(start, "days");
	for (let special_day of special_days) {
		special_day.day_count = moment(special_day.date).diff(start, "days")-1;
	}
	
	
	let day = 0;
	let tableBody = document.getElementById("calendar_body");
	for (let row = 0; row < ROW_COUNT; row++) {
		let newRow = document.createElement("tr");
		for (let column = 0; column < COLUMN_COUNT; column++) {
			let newCell = createCell(day, days_til_now, special_days);
			newRow.appendChild(newCell);
			day++;
		}
		tableBody.appendChild(newRow);
	}
	
	let jan_row = document.getElementById("jan_row");
	for (let jan_day = 0; jan_day < 20; jan_day++) {
		let newCell = createCell(day, days_til_now, special_days);
		jan_row.appendChild(newCell);
		day++;
	}
}

function createCell(day, days_til_now, special_days) {
	let newCell = document.createElement("td");
	let cellContents = document.createElement("div");
	cellContents.classList.add("content");
	
	if (day == days_til_now) {
		cellContents.classList.add("today");
	}
	else if (day > days_til_now) {
		cellContents.classList.add("future_day");
	} else {
		cellContents.classList.add("past_day");
	}
	let special = special_days.filter(special_day => special_day.day_count == day);
	if (special.length > 0) {
		cellContents.id = special[0].id;
		cellContents.addEventListener('mouseover', itemHover);
	}
	
	newCell.appendChild(cellContents);
	
	return newCell;
}

function itemHover(event) {
	let children = event.currentTarget.querySelector(".hover");
	if(!!children) { return; }
	
	let hoverView = document.createElement("div");
	hoverView.style.backgroundImage = window.getComputedStyle(event.currentTarget).getPropertyValue("background-image");
	hoverView.classList.add("hover");
	hoverView.addEventListener('mouseout', itemOut);
	event.currentTarget.appendChild(hoverView);
}

function itemOut(event) {
	event.currentTarget.remove();
}