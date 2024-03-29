const ROW_COUNT = 17;
const COLUMN_COUNT = 55;
const special_days = [ 
	{ id: "annoucement", date: "2019-06-10" },
	{ id: "leak", date: "2021-03-01" }, 
	{ id: "reveal", date: "2021-06-10" }, 
	{ id: "release", date: "2022-01-20" }
];
let annoucement_moment
let start;
let today;
let tooltips = [];

window.onload = function() {
	annoucement_moment = moment("2019-06-10", "YYYY-MM-DD");
	start = annoucement_moment.clone().subtract(COLUMN_COUNT-1, "days");
	today = moment().startOf("day");
	for (let special_day of special_days) {
		special_day.moment = moment(special_day.date);
	}
	
	let day = 0;
	let tableBody = document.getElementById("calendar_body");
	let newRow = document.createElement("tr");
	for (let column = 0; column < COLUMN_COUNT; column++) {
		let newCell = createCell(day, special_days, day !== COLUMN_COUNT - 1);
		newRow.appendChild(newCell);
		day++;
	}
	tableBody.appendChild(newRow);
	
	for (let row = 0; row < ROW_COUNT; row++) {
		newRow = document.createElement("tr");
		for (let column = 0; column < COLUMN_COUNT; column++) {
			let newCell = createCell(day, special_days);
			newRow.appendChild(newCell);
			day++;
		}
		tableBody.appendChild(newRow);
	}
	
	let jan_row = document.getElementById("jan_row");
	for (let jan_day = 0; jan_day < 20; jan_day++) {
		let newCell = createCell(day, special_days);
		jan_row.appendChild(newCell);
		day++;
	}
}

function createCell(day, special_days, empty = false) {
	const thisDay = start.clone().add(day, "days");
	const diff = today.diff(thisDay, "days");
		
	let newCell = document.createElement("td");
	let cellContents = document.createElement("div");
	cellContents.classList.add("content");
	
	if(!empty) {
		if (diff === 0) {
			cellContents.classList.add("today");
		}
		else if (diff < 0) {
			cellContents.classList.add("future_day");
		} else {
			cellContents.classList.add("past_day");
		}
		let special = special_days.filter(special_day => special_day.moment.diff(thisDay, "days") === 0);
		if (special.length > 0) {
			cellContents.id = special[0].id;
			cellContents.addEventListener('mouseover', specialHover);
		} else {
			//cellContents.addEventListener('mouseover', regularHover);
			cellContents.addEventListener('mousemove', basicTooltip, false);
			let tooltip = document.createElement("div");
			let format = "MMM DD YYYY [(" + diff + " days ago)]";
			if (diff < 0) {
				format = "MMM DD YYYY [(" + (diff * -1) + " days from now)]";
			} else if (diff === 0) {
				format = "MMM DD YYYY [(today)]";
			}
			tooltip.classList.add("tooltip");
			tooltip.innerText = start.clone().add(day, 'days').format(format);
			cellContents.appendChild(tooltip);
			tooltips.push(tooltip);
		}
	}
	
	newCell.appendChild(cellContents);
	
	return newCell;
}

function basicTooltip(event) {
	for (const tooltip of tooltips) {
		let rect = tooltip.parentElement.getBoundingClientRect();
		
        tooltip.style.left = (event.pageX - rect.left) + 'px';
        tooltip.style.top = (event.pageY - rect.top) + 'px';
    }
}

function specialHover(event) {
	let children = event.currentTarget.querySelector(".hover");
	if(!!children) { return; }
	
	let hoverView = document.createElement("div");
	hoverView.style.backgroundImage = window.getComputedStyle(event.currentTarget).getPropertyValue("background-image");
	hoverView.classList.add("hover");
	hoverView.addEventListener('mouseout', specialOut);
	event.currentTarget.appendChild(hoverView);
}

function specialOut(event) {
	event.currentTarget.remove();
}