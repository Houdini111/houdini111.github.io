const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20; 
const RENDER_SCALE: number = 35;
const GRID_LINE_WIDTH: number = 2;

const DEBUG_MODE: boolean = false;

let grid_ctx: CanvasRenderingContext2D;
let board_ctx: CanvasRenderingContext2D;
let debug_text: HTMLDivElement;

let start_time: number;
let last_update_time: number;
let current_piece: Piece;
let delta_time: number;
let piece_random: RandomPieces;

let IG: number;
let gravity_speed: number = 1/64; //64 ticks per block

class Segment {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
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
            this.segments.push(new Segment(0, 0));
        }
    }

    render(context: CanvasRenderingContext2D) :void {
        let oldStyle = context.fillStyle;

        context.fillStyle = this.color;
        for (let i: number = 0; i < this.segments.length; i++) {
            let segment: Segment = this.segments[i];
            context.fillRect((this.x + segment.x)*RENDER_SCALE, (this.y + segment.y)*RENDER_SCALE, RENDER_SCALE, RENDER_SCALE);
        }

        context.fillStyle = oldStyle;
    }
}

class O_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#FFFF00";

        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 1;
        this.segments[1].y = 0;

        this.segments[2].x = 0;
        this.segments[2].y = 1;

        this.segments[3].x = 1;
        this.segments[3].y = 1;
    }
}

class I_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#00FFFF";

        this.segments[0].x = 0;
        this.segments[0].y = 1;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 3;
        this.segments[3].y = 1;
    }
}

class T_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#FF00FF";

        this.segments[0].x = 1;
        this.segments[0].y = 1;

        this.segments[1].x = 0;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 0;

        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }
}

class S_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#00FF00";

        this.segments[0].x = 0;
        this.segments[0].y = 1;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 0;

        this.segments[3].x = 2;
        this.segments[3].y = 0;
    }
}

class Z_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#FF0000";

        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 1;
        this.segments[1].y = 0;

        this.segments[2].x = 1;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }
}

class J_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#0000FF";

        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 0;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }
}

class L_Piece extends Piece {
    constructor(x: number, y: number) {
        super(x, y);
        this.color = "#FFA500";

        this.segments[0].x = 0;
        this.segments[0].y = 1;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 0;
    }
}


class RandomPieces {
    peek(index: number): Piece {
        return null;
    }

    pop(): Piece {
        return null;
    }

    piece_array(): Piece[] {
        let arr:  Piece[] = new Array();

        arr.push(new O_Piece(0, 0));
        arr.push(new I_Piece(0, 0));
        arr.push(new T_Piece(0, 0));
        arr.push(new S_Piece(0, 0));
        arr.push(new Z_Piece(0, 0));
        arr.push(new J_Piece(0, 0));
        arr.push(new L_Piece(0, 0));

        return arr;
    }

    ensure_available(index: number): void {

    }
}

class TrueRandom extends RandomPieces {
    private random_queue: Piece[] = new Array()

    peek(index: number): Piece {
        this.ensure_available(index);
        return this.random_queue[index];
    }

    pop(): Piece {
        this.ensure_available(0);
        return this.random_queue.pop();
    }

    ensure_available(index: number): void {
        while (this.random_queue.length - 1 < index) {
            let i: number = Math.floor(Math.random() * 7);
            let new_piece: Piece = null;
            switch (i) {
                case 0:
                    new_piece = new O_Piece(0, 0);
                    break;
                case 1:
                    new_piece = new I_Piece(0, 0);
                    break;
                case 2:
                    new_piece = new T_Piece(0, 0);
                    break;
                case 3:
                    new_piece = new S_Piece(0, 0);
                    break;
                case 4:
                    new_piece = new Z_Piece(0, 0);
                    break;
                case 5:
                    new_piece = new J_Piece(0, 0);
                    break;
                case 6:
                    new_piece = new L_Piece(0, 0);
                    break;
            }
            if (new_piece) {
                this.random_queue.push(new_piece);
            }
        }
    }
}

class RandomBag extends RandomPieces {
    private bag_queue: Piece[] = new Array()

    peek(index: number): Piece {
        this.ensure_available(index);
        return this.bag_queue[index];
    }

    pop(): Piece {
        this.ensure_available(0);
        return this.bag_queue.pop();
    }

    ensure_available(index: number): void {
        if (this.bag_queue.length - 1 < index) {
            let pieces: Piece[] = this.piece_array();
            shuffleArray(pieces);
            this.bag_queue = this.bag_queue.concat(pieces);
        }
    }
}


function update(): void {
    let now = Date.now();
    delta_time = now - last_update_time;
    last_update_time = now;

    gravity();

    render_dynamic_board();
}

function gravity(): void {
    if (current_piece) {
        IG += (delta_time / 16.66) * gravity_speed; //Updates_completed / updates_per_block == blocks_to_move

        if (IG > 0) {
            current_piece.y += Math.floor(IG);
            IG -= Math.floor(IG);
        }

        if (DEBUG_MODE) {
            debug_text.innerText = "IG: " + IG;
        }
    }
}

function render_dynamic_board(): void {
    if (current_piece) {
        board_ctx.clearRect(0, 0, board_ctx.canvas.width, board_ctx.canvas.height);
        current_piece.render(board_ctx);
    }
}

function draw_grid(): void {
    if (GRID_LINE_WIDTH === 0) { return; }
    grid_ctx.strokeStyle = "#000000";
    grid_ctx.lineWidth = GRID_LINE_WIDTH;

    let w: number = grid_ctx.canvas.width;
    let h: number = grid_ctx.canvas.height;

    grid_ctx.clearRect(0, 0, grid_ctx.canvas.width, grid_ctx.canvas.height);

    for (let x: number = (GRID_LINE_WIDTH/2|0); x < w; x += RENDER_SCALE) {
        grid_ctx.moveTo(x, 0);
        grid_ctx.lineTo(x, h);
    }
    for (let y: number = (GRID_LINE_WIDTH/2|0); y < h; y += RENDER_SCALE) {
        grid_ctx.moveTo(0, y);
        grid_ctx.lineTo(w, y);
    }
    grid_ctx.stroke();
}

function on_load(): void {
    piece_random = new RandomBag();
    IG = 0;
    debug_text = <HTMLDivElement>document.getElementById("debug_text");

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
    grid_ctx.canvas.width = (BOARD_WIDTH * RENDER_SCALE) + GRID_LINE_WIDTH;
    grid_ctx.canvas.height = (BOARD_HEIGHT * RENDER_SCALE) + GRID_LINE_WIDTH;
    if (odd_offset) {
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
    }

    let board_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board");
    board_ctx = board_obj.getContext("2d");
    board_ctx.canvas.width = (BOARD_WIDTH * RENDER_SCALE) + GRID_LINE_WIDTH;
    board_ctx.canvas.height = (BOARD_HEIGHT * RENDER_SCALE) + GRID_LINE_WIDTH;
    if (odd_offset) {
        board_ctx.translate(0.5, 0.5);
    }
}

function start_keypress_listener() :void {
    document.addEventListener("keydown", function (event) {
        if (event.shiftKey) {

        }
        else if (event.keyCode === 32) { //Space
            current_piece = piece_random.pop();
        }
    });
}

function start_render_thread(): void {
    start_time = Date.now();
    last_update_time = start_time;
    setInterval(update, 16.66);
}

//Per https://stackoverflow.com/a/12646864/4698411
function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

window.onload = on_load;