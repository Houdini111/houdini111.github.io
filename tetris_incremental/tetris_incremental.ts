const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20; 
const RENDER_SCALE: number = 35;
const GRID_LINE_WIDTH: number = 1;

const DEBUG_MODE: boolean = true;

//Page objects
let grid_ctx: CanvasRenderingContext2D;
let board_ctx: CanvasRenderingContext2D;
let board_background: HTMLDivElement;
let debug_text: HTMLDivElement;

//Play values
let controller: Controller;
let controller_map: ControllerMap;
let start_time: number;
let last_update_time: number;
let current_piece: Piece;
let delta_time: number;
let piece_random: RandomPieces;
let IG: number;
let gravity_speed: number = 1 / 64; //64 ticks per block, not a const since it could increase


//Control values
class Controller {
    left_down: boolean;
    left_hold: boolean;
    left_up: boolean;

    right_down: boolean;
    right_hold: boolean;
    right_up: boolean;

    rotate_cw: boolean;
    rotate_ccw: boolean;

    hold: boolean;

    soft_drop: boolean;
    hard_drop: boolean;

    constructor() {
        this.left_down = false;
        this.left_hold = false;
        this.left_up = false;

        this.right_down = false;
        this.right_hold = false;
        this.right_up = false;

        this.rotate_cw = false;
        this.rotate_ccw = false;

        this.hold = false;

        this.soft_drop = false;
        this.hard_drop = false;
    }

    press(name: string): void {
        switch (name) {
            case "left":
                if (!this.left_hold) {
                    this.left_down = true;
                }
                this.left_hold = true;
                this.left_up = false;
                return;
            case "right":
                if (!this.right_hold) {
                    this.right_down = true;
                }
                this.right_hold = true;
                this.right_up = false;
                return;
            case "rotate_cw":
                this.rotate_cw = true;
                return;
            case "rotate_ccw":
                this.rotate_ccw = true;
                return;
            case "hold":
                this.hold = true;
                return;
            case "soft_drop":
                this.soft_drop = true;
                return;
            case "hard_drop":
                this.hard_drop = true;
                return;
        }
    }

    release(name: string): void {
        switch (name) {
            case "left":
                this.left_down = false;
                this.left_hold = false;
                this.left_up = true;
                return;
            case "right":
                this.right_down = false;
                this.right_hold = false;
                this.right_up = true;
                return;
        }
    }

    update(): void {
        //Reset temporary (up/down) and non-hold inputs
        this.left_down = false;
        this.left_up = false;

        this.right_down = false;
        this.right_up = false;

        this.rotate_cw = false;
        this.rotate_ccw = false;

        this.hold = false;

        this.soft_drop = false;
        this.hard_drop = false;
    }
}

class ControllerMap {
    left: number = 37; //L Arrow
    right: number = 39; //R Arrow

    rotate_cw: number = 88; //X
    rotate_ccw: number = -1; //Z

    hold: number = -2; //Shift (like control) is a special case, so I'm storing it as a negative

    soft_drop: number = 40; //D Arrow
    hard_drop: number = 32; //Space

    get_name_from_code(code: number): string {
        switch (code) {
            case this.left:
                return "left";
            case this.right:
                return "right";
            case this.rotate_cw:
                return "rotate_cw";
            case this.rotate_ccw:
                return "rotate_ccw";
            case this.hold:
                return "hold";
            case this.soft_drop:
                return "soft_drop";
            case this.hard_drop:
                return "hard_drop";
        }
        return null;
    }
}


//Game objects
class Segment {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Piece {
    x: number;
    y: number;
    segments: Segment[];
    color: string;
    rotation: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
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


//Logic objects
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

    if (DEBUG_MODE) {
        debug_text.innerText = "";
    }

    if (current_piece) {
        slide();
        rotate();
        gravity();
    }

    if (DEBUG_MODE) {
        debug_text.innerText += "current_piece: " + JSON.stringify(current_piece, null, "\t") + "\r\n";
    }
    if (controller.hard_drop) {
        current_piece = piece_random.pop();
    }
    update_controller();

    render_dynamic_board();
}


function slide(): void {
    let translate: number = 0;
    if (controller.left_down) {
        translate--;
    }
    else if (controller.right_down) {
        translate++;
    }
    if (translate !== 0) { 
        for (let segment of current_piece.segments) {
            if (segment.x + current_piece.x + translate < 0 || segment.x + current_piece.x + translate >= BOARD_WIDTH) {
                console.log(segment.x);
                translate = 0;
                break;
            }
        }
        current_piece.x += translate;
    }
}

function rotate(): void {

}

function gravity(): void {
    if (current_piece) {
        IG += (delta_time / 16.66) * gravity_speed; //Updates_completed / updates_per_block == blocks_to_move

        let to_move = Math.floor(IG);

        if (to_move) {
            for (let segment of current_piece.segments) {
                if (segment.y + current_piece.y + to_move >= BOARD_HEIGHT) {
                    to_move = 0;
                    break;
                }
            }
            if (to_move) {
                current_piece.y += to_move;
                IG -= to_move;
            }
        }

        if (DEBUG_MODE) {
            debug_text.innerText += "IG: " + IG + "\r\n";
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
    controller = new Controller();
    controller_map = new ControllerMap();

    debug_text = <HTMLDivElement>document.getElementById("debug_text");
    board_background = <HTMLDivElement>document.getElementById("board_background");

    prepare_canvases();

    draw_grid();

    start_key_listener();
    
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

    let w: number = (BOARD_WIDTH * RENDER_SCALE) + GRID_LINE_WIDTH;
    let h: number = (BOARD_HEIGHT * RENDER_SCALE) + GRID_LINE_WIDTH;

    let grid_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = w;
    grid_ctx.canvas.height = h;

    let board_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board");
    board_ctx = board_obj.getContext("2d");
    board_ctx.canvas.width = w;
    board_ctx.canvas.height = h;

    if (odd_offset) {
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
        board_ctx.translate(0.5, 0.5);
    }

    board_background.style.width = ""+w;
    board_background.style.height = ""+h;
}

function start_key_listener() :void {
    document.addEventListener("keydown", function (event) {
        let code: number = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, true);
    });
    document.addEventListener("keyup", function (event) {
        let code: number = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, false);
    });
}

function update_controller(keyCode: number = null, isDown: boolean = null): void {
    if (keyCode) {
        let name: string = controller_map.get_name_from_code(keyCode);
        if (isDown) {
            controller.press(name);
        }
        else if (isDown === false) {
            controller.release(name);
        }
        else {
            //TODO?
        }
    }
    else {
        controller.update();
        if (DEBUG_MODE) {
            let debug_str: string = "controller: " + JSON.stringify(controller, null, "\t") + "\r\n";
            debug_text.innerText += debug_str;
        }
    }
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