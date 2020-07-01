const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20; 
const DRAW_SCALE: number = 35;
const GRID_LINE_WIDTH: number = 2;

let grid_ctx: CanvasRenderingContext2D;
let board_ctx: CanvasRenderingContext2D;

class Segment {

}

class Piece {
    x: number = 0;
    y: number = 0;
    segments: Segment[];
    color: string;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.segments = new Array();
        for (let i: number = 0; i < 4; i++) {
            this.segments.push(new Segment());
        }
    }
}

class O_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#FFFF00";
    }
}

let start_time: number;
let last_render_time: number;
let current_piece: Piece;
let delta_time: number;


function render_dynamic_board(): void {
    let now = Date.now();
    delta_time = now - last_render_time;
    last_render_time = now;

    //let out: string = "RENDER. dt: " + delta_time;

    if (current_piece) {
        //out += " " + 2 * DRAW_SCALE;
        board_ctx.fillStyle = current_piece.color;
        board_ctx.fillRect(current_piece.x*DRAW_SCALE, current_piece.y*DRAW_SCALE, 2 * DRAW_SCALE, 2 * DRAW_SCALE);
    }

    //console.log(out);
}

function draw_grid(): void {
    grid_ctx.strokeStyle = "#000000";
    grid_ctx.lineWidth = GRID_LINE_WIDTH;
    //grid_ctx.globalAlpha = 1;

    let w: number = grid_ctx.canvas.width;
    let h: number = grid_ctx.canvas.height;

    grid_ctx.clearRect(0, 0, grid_ctx.canvas.width, grid_ctx.canvas.height);

    for (let x: number = (GRID_LINE_WIDTH/2|0); x < w; x += DRAW_SCALE) {
        grid_ctx.moveTo(x, 0);
        grid_ctx.lineTo(x, h);
    }
    for (let y: number = (GRID_LINE_WIDTH/2|0); y < h; y += DRAW_SCALE) {
        grid_ctx.moveTo(0, y);
        grid_ctx.lineTo(w, y);
    }
    grid_ctx.stroke();
}

function on_load(): void {
    prepare_canvases();

    draw_grid();

    start_keypress_listener();
    
    start_render_thread();
}

function prepare_canvases(): void {
    let oldMoveTo = CanvasRenderingContext2D.prototype.moveTo; //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
    CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
        x |= 0;
        y |= 0;
        oldMoveTo.call(this, x, y);
    }
    let oldLineTo = CanvasRenderingContext2D.prototype.lineTo;
    CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
        x |= 0;
        y |= 0;
        oldLineTo.call(this, x, y);
    }

    let odd_offset :number = GRID_LINE_WIDTH % 2 ? 1 : 0;

    let grid_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = (BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH;
    grid_ctx.canvas.height = (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH;
    if (odd_offset) {
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
    }

    let board_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board");
    board_ctx = board_obj.getContext("2d");
    board_ctx.canvas.width = (BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH;
    board_ctx.canvas.height = (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH;
    if (odd_offset) {
        board_ctx.translate(0.5, 0.5);
    }
}

function start_keypress_listener() :void {
    document.addEventListener("keydown", function (event) {
        if (event.shiftKey) {

        }
        else if (event.keyCode === 32) { //Space
            if (!current_piece) {
                current_piece = new O_Piece(8, 18);
            }
        }
    });
}

function start_render_thread(): void {
    start_time = Date.now();
    last_render_time = start_time;
    setInterval(render_dynamic_board, 16.66);
}

window.onload = on_load;