const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20; 
const RENDER_SCALE: number = 35;
const GRID_LINE_WIDTH: number = 1;

const DEBUG_MODE: boolean = true;

//Page objects
let grid_ctx: CanvasRenderingContext2D;
let board_ctx: CanvasRenderingContext2D;
let static_board_ctx: CanvasRenderingContext2D;
let board_background: HTMLDivElement;
let debug_text: HTMLDivElement;
let debug_text_2: HTMLDivElement;
let debug_text_3: HTMLDivElement;

let board_dirty: boolean;
let static_dirty: boolean;

//Play values
let board: Segment[][];
let controller: Controller;
let controller_map: ControllerMap;
let piece_random: RandomPieces;

let current_piece: Piece;
let static_pieces: Piece[];

let start_time: number;
let last_update_time: number;
let delta_time: number;
let update_times: number[] = [];
let UPDATES_TO_TRACK: number = 60;

let IG: number;
let gravity_speed: number = 1 / 64; //64 ticks per block, not a const since it could increase
let soft_drop_multiplier = 6;

let ARR: number = 0; //Auto Repeat Rate in ms
//let ARR: number = 0; //Auto Repeat Rate in frames, can be fractional to indicate multiple moves per frame
let DAS: number = 150; //Delayed Auto Shift in ms
let ARR_countdown: number = -1;
let DAS_countdown: number = -1;
let repeat_right: boolean;
let left_down_at: number;
let right_down_at: number;


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
            case "soft_drop":
                this.soft_drop = false;
                return;
        }
    }
}

class ControllerMap {
    left: number = 37; //L Arrow
    right: number = 39; //R Arrow

    rotate_cw: number = 88; //X
    rotate_ccw: number = 90; //Z

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
    parent: Piece;

    constructor(x: number, y: number, parent: Piece) {
        this.x = x;
        this.y = y;
        this.parent = parent;
    }

    canParentMove(board: Segment[][], parent_x: number, parent_y: number): boolean {
        //Useful for translation (gravity/slide)
        return this.canIMove(board, this.x, this.y, parent_x, parent_y);
    }

    canIMove(board: Segment[][], my_x: number, my_y: number, parent_x: number = this.parent.x, parent_y: number = this.parent.y) {
        //Useful for rotation (including kicks)
        let new_x: number = parent_x + my_x;
        let new_y: number = parent_y + my_y;
        if (new_x < 0 || new_x >= BOARD_WIDTH) { return false; }
        if (new_y >= BOARD_HEIGHT) { return false; }
        if (new_x >= board.length) { return true; }
        if (new_y >= board[new_x].length) { return true; }
        return board[new_x][new_y] == null;
    }
}

abstract class Piece {
    x: number;
    y: number;
    segments: Segment[];
    color: string;
    rotation: number;
    ghost: Piece;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.segments = [];
        for (let i: number = 0; i < 4; i++) {
            this.segments.push(new Segment(0, 0, this));
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

    canMove(board: Segment[][], x: number, y: number): boolean {
        return this.segments.every((segment) => segment.canParentMove(board, x, y) );
    }

    rotate(cw: boolean): void {
        this.rotation += cw ? 90 : -90;
        while (this.rotation >= 360) {
            this.rotation -= 360;
        }
        while (this.rotation < 0) {
            this.rotation += 360;
        }

        switch (this.rotation) {
            case 0:
                this.rotate_to_0(); break;
            case 90:
                this.rotate_to_90(); break;
            case 180:
                this.rotate_to_180(); break;
            case 270:
                this.rotate_to_270(); break;
        }

        this.handle_ghost();
    }

    rotate_to_0(): void {

    }

    rotate_to_90(): void {

    }

    rotate_to_180(): void {

    }

    rotate_to_270(): void {

    }

    make_ghost(): void {
        this.ghost = new Ghost_Piece(this.x, this.y);
        this.ghost.color = this.color;
    }

    handle_ghost(): void {
        this.ghost.x = this.x;
        this.ghost.y = this.y;
        for (let i = 0; i < this.segments.length; i++) {
            this.ghost.segments[i].x = this.segments[i].x;
            this.ghost.segments[i].y = this.segments[i].y;
        }

        let y: number = this.ghost.y;
        for (; y < BOARD_HEIGHT; y++) {
            if (!this.ghost.canMove(board, this.ghost.x, y)) {
                break;
            }
        }
        this.ghost.y = y - 1;
    }
}

class Ghost_Piece extends Piece {

}

class O_Piece extends Piece {
    constructor() {
        super(4, 0);
        this.color = "#FFFF00";

        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 1;
        this.segments[1].y = 0;

        this.segments[2].x = 0;
        this.segments[2].y = 1;

        this.segments[3].x = 1;
        this.segments[3].y = 1;


        this.make_ghost();
    }
}

class I_Piece extends Piece {
    constructor() {
        super(3, 0);
        this.color = "#00FFFF";

        this.segments[0].x = 0;
        this.segments[0].y = 1;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 3;
        this.segments[3].y = 1;


        this.make_ghost();
    }

    rotate_to_0(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 1;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 3;
        this.segments[3].y = 1;
    }

    rotate_to_90(): void {
        this.segments[0].x = 2;
        this.segments[0].y = 0;

        this.segments[1].x = 2;
        this.segments[1].y = 1;

        this.segments[2].x = 2;
        this.segments[2].y = 2;

        this.segments[3].x = 2;
        this.segments[3].y = 3;
    }

    rotate_to_180(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 2;

        this.segments[1].x = 1;
        this.segments[1].y = 2;

        this.segments[2].x = 2;
        this.segments[2].y = 2;

        this.segments[3].x = 3;
        this.segments[3].y = 2;
    }

    rotate_to_270(): void {
        this.segments[0].x = 1;
        this.segments[0].y = 0;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 2;

        this.segments[3].x = 1;
        this.segments[3].y = 3;
    }
}

class T_Piece extends Piece {
    constructor() {
        super(3, 0);
        this.color = "#FF00FF";

        this.segments[0].x = 1;
        this.segments[0].y = 1;

        this.segments[1].x = 0;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 0;

        this.segments[3].x = 2;
        this.segments[3].y = 1;


        this.make_ghost();
    }

    rotate_to_0(): void {
        this.segments[1].x = 0;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 0;

        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }

    rotate_to_90(): void {
        this.segments[1].x = 1;
        this.segments[1].y = 0;

        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 1;
        this.segments[3].y = 2;
    }

    rotate_to_180(): void {
        this.segments[1].x = 2;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 2;

        this.segments[3].x = 0;
        this.segments[3].y = 1;
    }

    rotate_to_270(): void {
        this.segments[1].x = 1;
        this.segments[1].y = 2;

        this.segments[2].x = 0;
        this.segments[2].y = 1;

        this.segments[3].x = 1;
        this.segments[3].y = 0;
    }
}

class S_Piece extends Piece {
    constructor() {
        super(3, 0);
        this.color = "#00FF00";

        this.segments[0].x = 0;
        this.segments[0].y = 1;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 0;

        this.segments[3].x = 2;
        this.segments[3].y = 0;


        this.make_ghost();
    }

    rotate_to_0(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 1;


        this.segments[2].x = 1;
        this.segments[2].y = 0;

        this.segments[3].x = 2;
        this.segments[3].y = 0;
    }

    rotate_to_90(): void {
        this.segments[0].x = 1;
        this.segments[0].y = 0;


        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 2;
    }

    rotate_to_180(): void {
        this.segments[0].x = 2;
        this.segments[0].y = 1;


        this.segments[2].x = 1;
        this.segments[2].y = 2;

        this.segments[3].x = 0;
        this.segments[3].y = 2;
    }

    rotate_to_270(): void {
        this.segments[0].x = 1;
        this.segments[0].y = 2;


        this.segments[2].x = 0;
        this.segments[2].y = 1;

        this.segments[3].x = 0;
        this.segments[3].y = 0;
    }
}

class Z_Piece extends Piece {
    constructor() {
        super(3, 0);
        this.color = "#FF0000";

        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 1;
        this.segments[1].y = 0;

        this.segments[2].x = 1;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 1;


        this.make_ghost();
    }

    rotate_to_0(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 1;
        this.segments[1].y = 0;


        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }

    rotate_to_90(): void {
        this.segments[0].x = 2;
        this.segments[0].y = 0;

        this.segments[1].x = 2;
        this.segments[1].y = 1;


        this.segments[3].x = 1;
        this.segments[3].y = 2;
    }

    rotate_to_180(): void {
        this.segments[0].x = 2;
        this.segments[0].y = 2;

        this.segments[1].x = 1;
        this.segments[1].y = 2;


        this.segments[3].x = 0;
        this.segments[3].y = 1;
    }

    rotate_to_270(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 2;

        this.segments[1].x = 0;
        this.segments[1].y = 1;


        this.segments[3].x = 1;
        this.segments[3].y = 0;
    }
}

class J_Piece extends Piece {
    constructor() {
        super(3, 0);
        this.color = "#0000FF";

        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 0;
        this.segments[1].y = 1;

        this.segments[2].x = 1;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 1;


        this.make_ghost();
    }

    rotate_to_0(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 0;

        this.segments[1].x = 0;
        this.segments[1].y = 1;


        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }

    rotate_to_90(): void {
        this.segments[0].x = 2;
        this.segments[0].y = 0;

        this.segments[1].x = 1;
        this.segments[1].y = 0;


        this.segments[3].x = 1;
        this.segments[3].y = 2;
    }

    rotate_to_180(): void {
        this.segments[0].x = 2;
        this.segments[0].y = 2;

        this.segments[1].x = 2;
        this.segments[1].y = 1;


        this.segments[3].x = 0;
        this.segments[3].y = 1;
    }

    rotate_to_270(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 2;

        this.segments[1].x = 1;
        this.segments[1].y = 2;


        this.segments[3].x = 1;
        this.segments[3].y = 0;
    }
}

class L_Piece extends Piece {
    constructor() {
        super(3, 0);
        this.color = "#FFA500";

        this.segments[0].x = 0;
        this.segments[0].y = 1;

        this.segments[1].x = 1;
        this.segments[1].y = 1;

        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 0;


        this.make_ghost();
    }

    rotate_to_0(): void {
        this.segments[0].x = 0;
        this.segments[0].y = 1;


        this.segments[2].x = 2;
        this.segments[2].y = 1;

        this.segments[3].x = 2;
        this.segments[3].y = 0;
    }

    rotate_to_90(): void {
        this.segments[0].x = 1;
        this.segments[0].y = 0;


        this.segments[2].x = 1;
        this.segments[2].y = 2;

        this.segments[3].x = 2;
        this.segments[3].y = 2;
    }

    rotate_to_180(): void {
        this.segments[0].x = 2;
        this.segments[0].y = 1;


        this.segments[2].x = 0;
        this.segments[2].y = 1;

        this.segments[3].x = 0;
        this.segments[3].y = 2;
    }

    rotate_to_270(): void {
        this.segments[0].x = 1;
        this.segments[0].y = 2;


        this.segments[2].x = 1;
        this.segments[2].y = 0;

        this.segments[3].x = 0;
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
        let arr:  Piece[] = [];

        arr.push(new O_Piece());
        arr.push(new I_Piece());
        arr.push(new T_Piece());
        arr.push(new S_Piece());
        arr.push(new Z_Piece());
        arr.push(new J_Piece());
        arr.push(new L_Piece());

        return arr;
    }

    ensure_available(index: number): void {

    }
}

class TrueRandom extends RandomPieces {
    private random_queue: Piece[] = []

    peek(index: number): Piece {
        this.ensure_available(index);
        return this.random_queue[index];
    }

    pop(): Piece {
        this.ensure_available(0);
        return this.random_queue.shift();
    }

    ensure_available(index: number): void {
        while (this.random_queue.length - 1 < index) {
            let i: number = Math.floor(Math.random() * 7);
            let new_piece: Piece = null;
            switch (i) {
                case 0:
                    new_piece = new O_Piece();
                    break;
                case 1:
                    new_piece = new I_Piece();
                    break;
                case 2:
                    new_piece = new T_Piece();
                    break;
                case 3:
                    new_piece = new S_Piece();
                    break;
                case 4:
                    new_piece = new Z_Piece();
                    break;
                case 5:
                    new_piece = new J_Piece();
                    break;
                case 6:
                    new_piece = new L_Piece();
                    break;
            }
            if (new_piece) {
                this.random_queue.push(new_piece);
            }
        }
    }
}

class RandomBag extends RandomPieces {
    private bag_queue: Piece[] = []

    peek(index: number): Piece {
        this.ensure_available(index);
        return this.bag_queue[index];
    }

    pop(): Piece {
        this.ensure_available(0);
        return this.bag_queue.shift();
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
    let now = window.performance.now();
    delta_time = now - last_update_time;
    last_update_time = now;

    if (DEBUG_MODE) {
        update_times.push(delta_time);
        if (update_times.length > UPDATES_TO_TRACK) {
            update_times.shift();
        }

        debug_text.innerText = "delta_time " + delta_time + "\r\n";
        debug_text.innerText += "instantaneous_ups " + (1000 / delta_time) + "\r\n";
        let total_time: number = 0;
        for (let t of update_times) {
            total_time += t;
        }
        debug_text.innerText += UPDATES_TO_TRACK + "_update_mspu " + (total_time / update_times.length) + "\r\n";
        debug_text.innerText += UPDATES_TO_TRACK + "_update_ups " + (1000/(total_time / update_times.length)) + "\r\n";
        let debug_str: string = "controller: " + stringify(controller, null, "\t") + "\r\n";
        debug_text.innerText += debug_str;
    }

    if (current_piece) {
        slide();
        rotate();
        gravity();
    }

    if (DEBUG_MODE) {
        debug_text.innerText += "current_piece: " + stringify(current_piece, null, "\t") + "\r\n";
        debug_text.innerText += "static pieces: " + static_pieces.length + "\r\n";
    }

    if (DEBUG_MODE) {
        let then = window.performance.now();
        debug_text.innerText += "update took " + (then - now) + "\r\n";
    }
}


function slide(): void {
    let translate: number = 0;
    if (controller.left_down) {
        translate--;
        DAS_countdown = DAS;
        repeat_right = false;
        left_down_at = last_update_time;
    }
    if (controller.left_hold) {
        DAS_countdown -= delta_time;
        if (DAS_countdown < 0) {
            DAS_countdown = 0;
        }
    }
    if (controller.left_up) {
        DAS_countdown = -1;
        ARR_countdown = -1;
    }
    

    if (controller.right_down) {
        translate++;
        DAS_countdown = DAS;
        repeat_right = true;
        right_down_at = last_update_time;
    }
    if (controller.right_hold) {
        DAS_countdown -= delta_time;
        if (DAS_countdown < 0) {
            DAS_countdown = 0;
        }
    }
    if (controller.right_up) {
        controller.left_hold = false;
        DAS_countdown = -1;
        ARR_countdown = -1;
    }

    if (DAS_countdown === 0) {
        if (ARR > 0) {
            if (ARR_countdown === -1) {
                ARR_countdown = ARR;
            }
            else {
                ARR_countdown -= delta_time;
                if (ARR_countdown < 0) {
                    ARR_countdown = 0;
                }
                if (ARR_countdown === 0) {
                    if (repeat_right) {
                        translate++;
                    }
                    else {
                        translate--;
                    }
                    ARR_countdown = ARR;
                }
            }
        }
        else {
            if (repeat_right) {
                translate = BOARD_WIDTH;
            }
            else {
                translate = -BOARD_WIDTH;
            }
            ARR_countdown = 0;
        }
    }

    if (DEBUG_MODE) {
        debug_text.innerText += "DAS: " + DAS_countdown + "/" + DAS + "\r\n";
        debug_text.innerText += "ARR: " + ARR_countdown + "/" + ARR + "\r\n";
        debug_text.innerText += "repeat_right: " + repeat_right + "\r\n";
        debug_text.innerText += "translate: " + translate + "\r\n";
    }

    if (translate !== 0) {
        let x: number = current_piece.x;
        for (; repeat_right ? x < current_piece.x + translate : x > current_piece.x + translate; repeat_right ? x++ : x--) {
            if (!current_piece.canMove(board, repeat_right ? x + 1 : x - 1, current_piece.y)) {
                break;
            }
        }
        current_piece.x = x;
        board_dirty = true;
    }
    current_piece.handle_ghost();

    //"Handled" inputs
    controller.left_down = false;
    controller.left_up = false;

    controller.right_down = false;
    controller.right_up = false;
}

function rotate(): void {
    if (controller.rotate_cw) {
        current_piece.rotate(true);
        board_dirty = true;
        controller.rotate_cw = false;
    }
    else if (controller.rotate_ccw) {
        current_piece.rotate(false);
        board_dirty = true;
        controller.rotate_ccw = false;
    }
}

function gravity(): void {
    if (current_piece) {
        if (controller.hard_drop) {
            for (let y: number = current_piece.y; y < BOARD_HEIGHT; y++) {
                if (!current_piece.canMove(board, current_piece.x, y)) {
                    current_piece.y = y - 1;
                    board_dirty = true;
                    break;
                }
            }

            controller.hard_drop = false;
            solidify();
        }
        else {
            let IG_change: number = (delta_time / 16.66) * gravity_speed; //Updates_completed / updates_per_block == blocks_to_move
            if (controller.soft_drop) {
                IG_change *= soft_drop_multiplier;
            }
            IG += IG_change;

            let to_move = Math.floor(IG);

            if (to_move) {
                let y: number = current_piece.y + to_move;
                for (; y > current_piece.y; y--) {
                    if (current_piece.canMove(board, current_piece.x, y)) {
                        current_piece.y += to_move;
                        board_dirty = true;
                        IG -= to_move;
                    }
                }
                if (y === current_piece.y) {
                    solidify()
                }
            }
        }
    } 
    if(DEBUG_MODE) {
        debug_text.innerText += "IG: " + IG + "\r\n";
    }
}


function render(): void {
    if (board_dirty) {
        render_dynamic_board();
        board_dirty = false;
    }
    if (static_dirty) {
        render_static_board(); 
        static_dirty = false;
    }
}

function render_dynamic_board(): void {
    if (current_piece) {
        board_ctx.clearRect(0, 0, board_ctx.canvas.width, board_ctx.canvas.height);
        board_ctx.globalAlpha = 0.5;
        current_piece.ghost.render(board_ctx);
        board_ctx.globalAlpha = 1;
        current_piece.render(board_ctx);
    }
}

function render_static_board(): void {
    static_board_ctx.clearRect(0, 0, static_board_ctx.canvas.width, static_board_ctx.canvas.height);
    for (let p of static_pieces) {
        p.render(static_board_ctx);
    }
}

function render_grid(): void {
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


function new_piece(): void {
    current_piece = piece_random.pop();
    current_piece.handle_ghost();
    board_dirty = true;
    IG = 0;
}

function solidify(): void {
    static_pieces.push(current_piece);

    for (let segment of current_piece.segments) {
        let s_x = segment.x + current_piece.x;
        let s_y = segment.y + current_piece.y;
        board[s_x][s_y] = segment;
    }

    let rows_to_clear: number[] = []
    for (let y: number = BOARD_HEIGHT - 1; y >= 0; y--) {
        let solid: boolean = true;
        for (let x: number = 0; x < BOARD_WIDTH; x++) {
            if (!board[x][y]) {
                solid = false;
                break;
            }
        }
        if (solid) {
            rows_to_clear.push(y);
        }
    }
    if (rows_to_clear.length > 0) {
        for (let i: number = 0; i < rows_to_clear.length; i++) {
            let y: number = rows_to_clear[i];
            for (let x: number = 0; x < BOARD_WIDTH; x++) {
                let segment: Segment = board[x][y];
                //Remove segment from parent
                let s_index = segment.parent.segments.indexOf(segment);
                segment.parent.segments.splice(s_index, 1);
                if (segment.parent.segments.length == 0) {
                    //Remove parent from list
                    let p_index = static_pieces.indexOf(segment.parent);
                    static_pieces.splice(p_index, 1);
                }
                board[x][y] = null;
            }
        }
        let b: number = 0;
        let shift_amt: number = 1;
        for (let y: number = rows_to_clear[0] - 1; y >= 0; y--) {
            for (let x: number = 0; x < BOARD_WIDTH; x++) {
                board[x][y + shift_amt] = board[x][y];
                if (board[x][y]) {
                    board[x][y].y += shift_amt;
                    board[x][y] = null;
                }
            }
            if (rows_to_clear.some((row) => row === y)) {
                shift_amt++;
            }
            b++;
            if (b === 30) {
                break;
            }
        }
        static_dirty = true;
    }
    else {
        static_dirty = true;
    }

    new_piece();
}


function on_load(): void {
    board = [];
    for (let x: number = 0; x < BOARD_WIDTH; x++) {
        board[x] = []
        for (let y: number = 0; y < BOARD_HEIGHT; y++) {
            board[x][y] = null;
        }
    }
    static_pieces = [];
    piece_random = new RandomBag();
    IG = 0;
    controller = new Controller();
    controller_map = new ControllerMap();

    debug_text = <HTMLDivElement>document.getElementById("debug_text");
    debug_text_2 = <HTMLDivElement>document.getElementById("debug_text_2");
    debug_text_3 = <HTMLDivElement>document.getElementById("debug_text_3");
    board_background = <HTMLDivElement>document.getElementById("board_background");

    prepare_canvases();

    render_grid();

    start_key_listener();

    new_piece();

    start_time = window.performance.now();
    last_update_time = start_time;
    setInterval(update, 0); //0 usually becomes forced to a minimum of 10 by the browser
    setInterval(render, 16);
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

    let static_board_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("static_board");
    static_board_ctx = static_board_obj.getContext("2d");
    static_board_ctx.canvas.width = w;
    static_board_ctx.canvas.height = h;

    if (odd_offset) {
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
        board_ctx.translate(0.5, 0.5);
        static_board_ctx.translate(0.5, 0.5);
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
        document.dispatchEvent(new Event('keypress', ({"keyCode": event.keyCode} as { [key: string]: number })));
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
    //TODO ////////// Handle multiple simultaneous presses (soft drop + other)
    if (keyCode) {
        let name: string = controller_map.get_name_from_code(keyCode);
        if (name === null) {
            console.log("unsupported keycode " + keyCode);
        }
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

//Per https://gist.github.com/saitonakamura/d51aa672c929e35cc81fa5a0e31f12a9#gistcomment-3201131
function stringify(obj: any, replacer: any, indent: string): string {
    let replaceCircular = function (val: any, cache: any = null) {
        cache = cache || new WeakSet();
        if (val && typeof (val) === 'object') {
            if (cache.has(val)) return '[CircularRef]';

            cache.add(val);

            let obj = (Array.isArray(val) ? [] : {});
            for (var idx in val) {
                //Per https://stackoverflow.com/a/57568856/4698411
                (obj as { [key: string]: any })[idx] = replaceCircular(val[idx], cache);
            }

            cache.delete(val);
            return obj;
        }
        return val;
    };
    return JSON.stringify(replaceCircular(obj), replacer, indent);
};


window.onload = on_load;