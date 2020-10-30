const CELL_SIZE = 10;
const PADDING = 50;
const WALL_COLOR = "black";
const FREE_COLOR = "white";
const BACKGROUND_COLOR = "gray";
const TRACTOR_COLOR = "red";

const TRACTORS_NUMBER = 2;
const DELAY_TIMEOUT = 100;
const COLUMNS = 51;
const ROWS = 51;

const WITH_ANIMATION = false;

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

const mouse = createMouse(canvas);

let cell1 = null;
let cell2 = null;
let potentials = null;
let path = null;

const matrix = createMatrix(COLUMNS, ROWS);
const tractors = [];
for (let i = 0; i < TRACTORS_NUMBER; i++) {
	tractors.push({
		x: 0,
		y: 0,
	});
}
matrix[0][0] = true;

main();

async function main() {
	while (!isValidMaze()) {
		for (const tractor of tractors) {
			moveTractor(tractor);
		}

		if (WITH_ANIMATION) {
			drawMaze();

			for (const tractor of tractors) {
				drawTractor(tractor);
			}

			await delay(DELAY_TIMEOUT);
		}
	}

	requestAnimationFrame(tick);
}

function delay(timeout) {
	return new Promise((resolve) => setTimeout(resolve, timeout));
}

function createMatrix(columns, rows) {
	const matrix = [];

	for (let y = 0; y < rows; y++) {
		const row = [];

		for (let x = 0; x < columns; x++) {
			row.push(false);
		}

		matrix.push(row);
	}

	return matrix;
}

function drawMaze() {
	canvas.width = PADDING * 2 + COLUMNS * CELL_SIZE;
	canvas.height = PADDING * 2 + ROWS * CELL_SIZE;

	context.beginPath();
	context.rect(0, 0, canvas.width, canvas.height);
	context.fillStyle = BACKGROUND_COLOR;
	context.fill();

	for (let y = 0; y < COLUMNS; y++) {
		for (let x = 0; x < ROWS; x++) {
			const color = matrix[y][x] ? FREE_COLOR : WALL_COLOR;

			context.beginPath();
			context.rect(
				PADDING + x * CELL_SIZE,
				PADDING + y * CELL_SIZE,
				CELL_SIZE,
				CELL_SIZE
			);
			context.fillStyle = color;
			context.fill();
		}
	}
}

function drawTractor(tractor) {
	context.beginPath();
	context.rect(
		PADDING + tractor.x * CELL_SIZE,
		PADDING + tractor.y * CELL_SIZE,
		CELL_SIZE,
		CELL_SIZE
	);
	context.fillStyle = TRACTOR_COLOR;
	context.fill();
}

function moveTractor(tractor) {
	const directions = [];

	if (tractor.x > 0) {
		directions.push([-2, 0]);
	}

	if (tractor.x < COLUMNS - 1) {
		directions.push([2, 0]);
	}

	if (tractor.y > 0) {
		directions.push([0, -2]);
	}

	if (tractor.y < ROWS - 1) {
		directions.push([0, 2]);
	}

	const [dx, dy] = getRandomItem(directions);

	tractor.x += dx;
	tractor.y += dy;

	if (!matrix[tractor.y][tractor.x]) {
		matrix[tractor.y][tractor.x] = true;
		matrix[tractor.y - dy / 2][tractor.x - dx / 2] = true;
	}
}

function getRandomItem(array) {
	const index = Math.floor(Math.random() * array.length);
	return array[index];
}

function isValidMaze() {
	for (let y = 0; y < COLUMNS; y += 2) {
		for (let x = 0; x < ROWS; x += 2) {
			if (!matrix[y][x]) {
				return false;
			}
		}
	}

	return true;
}

function createMouse(element) {
	const mouse = {
		x: 0,
		y: 0,

		left: false,
		pLeft: false,

		over: false,

		update() {
			this.pLeft = this.left;
		},
	};

	element.addEventListener("mouseenter", mouseenterHandler);
	element.addEventListener("mouseleave", mouseleaveHandler);
	element.addEventListener("mousemove", mousemoveHandler);
	element.addEventListener("mousedown", mousedownHandler);
	element.addEventListener("mouseup", mouseupHandler);

	function mouseenterHandler() {
		mouse.over = true;
	}

	function mouseleaveHandler() {
		mouse.over = false;
	}

	function mousemoveHandler(event) {
		const rect = element.getBoundingClientRect();
		mouse.x = event.clientX - rect.left;
		mouse.y = event.clientY - rect.top;
	}

	function mousedownHandler(event) {
		mouse.left = true;
	}

	function mouseupHandler(event) {
		mouse.left = false;
	}

	return mouse;
}

function tick() {
	requestAnimationFrame(tick);

	drawMaze();

	if (path) {
		for (const [x, y] of path) {
			context.fillStyle = "green";
			context.fillRect(
				PADDING + x * CELL_SIZE,
				PADDING + y * CELL_SIZE,
				CELL_SIZE,
				CELL_SIZE
			);
		}
	}

	if (
		mouse.x < PADDING ||
		mouse.y < PADDING ||
		mouse.x > canvas.width - PADDING ||
		mouse.y > canvas.height - PADDING
	) {
		return;
	}

	const x = Math.floor((mouse.x - PADDING) / CELL_SIZE);
	const y = Math.floor((mouse.y - PADDING) / CELL_SIZE);

	if (mouse.left && !mouse.pLeft && matrix[y][x]) {
		if (!cell1 || cell1[0] !== x || cell1[1] !== y) {
			cell2 = cell1;
			cell1 = [x, y];
		}

		if (cell1 && cell2) {
			potentials = getPotentialsMatrix(matrix, cell1, cell2);

			let [x, y] = cell1;
			let potential = potentials[y][x];
			path = [[x, y]];

			while (potential !== 0) {
				potential--;

				if (y > 0 && potentials[y - 1][x] === potential) {
					path.push([x, y - 1]);
					y--;
					continue;
				}

				if (y < COLUMNS - 1 && potentials[y + 1][x] === potential) {
					path.push([x, y + 1]);
					y++;
					continue;
				}

				if (x > 0 && potentials[y][x - 1] === potential) {
					path.push([x - 1, y]);
					x--;
					continue;
				}

				if (x < ROWS - 1 && potentials[y][x + 1] === potential) {
					path.push([x + 1, y]);
					x++;
					continue;
				}
			}

			console.log(path);
		}
	}

	// if (potentials) {
	// 	for (let y = 0; y < COLUMNS; y++) {
	// 		for (let x = 0; x < ROWS; x++) {
	// 			if (potentials[y][x] === null || potentials[y][x] === false) {
	// 				continue;
	// 			}

	// 			context.fillStyle = "red";
	// 			context.font = "30px serif";
	// 			context.textAlign = "center";
	// 			context.textBaseline = "middle";
	// 			context.fillText(
	// 				potentials[y][x],
	// 				PADDING + x * CELL_SIZE + CELL_SIZE * 0.5,
	// 				PADDING + y * CELL_SIZE + CELL_SIZE * 0.5
	// 			);
	// 		}
	// 	}
	// }

	mouse.update();
}

function getPotentialsMatrix(matrix, [x1, y1], [x2, y2]) {
	const potentials = [];

	for (let y = 0; y < matrix.length; y++) {
		const row = [];

		for (let x = 0; x < matrix[y].length; x++) {
			row.push(null);
		}

		potentials.push(row);
	}

	for (let y = 0; y < matrix.length; y++) {
		for (let x = 0; x < matrix[y].length; x++) {
			if (matrix[y][x] === false) {
				potentials[y][x] = false;
			}
		}
	}

	potentials[y2][x2] = 0;

	while (potentials[y1][x1] === null) {
		for (let y = 0; y < matrix.length; y++) {
			for (let x = 0; x < matrix[y].length; x++) {
				if (potentials[y][x] === false || potentials[y][x] === null) {
					continue;
				}

				const number = potentials[y][x] + 1;

				if (y > 0 && potentials[y - 1][x] !== false) {
					if (potentials[y - 1][x] === null) {
						potentials[y - 1][x] = number;
					} else {
						potentials[y - 1][x] = Math.min(potentials[y - 1][x], number);
					}
				}

				if (y < matrix.length - 1 && potentials[y + 1][x] !== false) {
					if (potentials[y + 1][x] === null) {
						potentials[y + 1][x] = number;
					} else {
						potentials[y + 1][x] = Math.min(potentials[y + 1][x], number);
					}
				}

				if (x > 0 && potentials[y][x - 1] !== false) {
					if (potentials[y][x - 1] === null) {
						potentials[y][x - 1] = number;
					} else {
						potentials[y][x - 1] = Math.min(potentials[y][x - 1], number);
					}
				}

				if (x < matrix[0].length - 1 && potentials[y][x + 1] !== false) {
					if (potentials[y][x + 1] === null) {
						potentials[y][x + 1] = number;
					} else {
						potentials[y][x + 1] = Math.min(potentials[y][x + 1], number);
					}
				}
			}
		}
	}

	return potentials;
}
