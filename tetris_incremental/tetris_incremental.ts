const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20; 
const RENDER_SCALE: number = 35;
const GRID_LINE_WIDTH: number = 1;

const DEBUG_MODE: boolean = true;

//Page objects
let grid_ctx: CanvasRenderingContext2D;
let piece_ctx: CanvasRenderingContext2D;
let ghost_ctx: CanvasRenderingContext2D;
let static_piece_ctx: CanvasRenderingContext2D;
let board_background: HTMLDivElement;
let board_container: HTMLDivElement;
let debug_text: HTMLDivElement;
let debug_text_2: HTMLDivElement;
let debug_text_3: HTMLDivElement;
let lines_stat: HTMLDivElement;
let purchases: HTMLDivElement;

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
let previous_held_for: number;

let LOCK_DELAY: number = 500; //Miliseconds before lock
let lock_countdown: number = -1;

let held_piece: Piece;

let lines_cleared: number;
let total_lines_cleared: number;

let unpurchased_purchases: Purchase[];
let visible_purchases: Purchase[];
let purchased_purchases: Purchase[];

//Purchases
class Purchase {
    name: string;
    visible_at: number;
    price: number;
    buy_logic: () => void;

    constructor(name: string, visible_at: number, price: number, buy_logic: () => void) {
        this.name = name;
        this.visible_at = visible_at;
        this.price = price;
        this.buy_logic = buy_logic;
    }
}

//Purchase vars
let o_piece: boolean;
let s_piece: boolean;
let z_piece: boolean;
let l_piece: boolean;
let j_piece: boolean;
let t_piece: boolean;
let i_piece: boolean;


//Control values
class Controller {
    left_down: boolean;
    left_hold: boolean;
    left_up: boolean;
    left_down_start: number;
    left_down_time: number;

    right_down: boolean;
    right_hold: boolean;
    right_up: boolean;
    right_down_start: number;
    right_down_time: number;

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
                    this.left_down_start = window.performance.now();
                    this.left_down_time = 0;
                }
                this.left_hold = true;
                this.left_up = false;
                return;
            case "right":
                if (!this.right_hold) {
                    this.right_down = true;
                    this.right_down_start = window.performance.now();
                    this.right_down_time = 0;
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
                this.left_down_time = this.left_down_start - window.performance.now();
                return;
            case "right":
                this.right_down = false;
                this.right_hold = false;
                this.right_up = true;
                this.right_down_time = this.right_down_start - window.performance.now();
                return;
            case "soft_drop":
                this.soft_drop = false;
                return;
        }
    }

    clear(): void {
        this.left_down = false;
        this.left_hold = false;
        this.left_up = false;
        this.left_down_start = 0;
        this.left_down_time = 0;

        this.right_down = false;
        this.right_hold = false;
        this.right_up = false;
        this.right_down_start = 0;
        this.right_down_time = 0;

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
class SRS {
    //Per https://tetris.wiki/Super_Rotation_System
    static readonly jlstz_kicks: [number, number][][] = [
        [[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]], //0->R //CW
        [[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]], //0->L //CCW
        [[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]], //R->2 //CW
        [[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]], //R->0 //CCW
        [[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]], //2->L //CW 
        [[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]], //2->R //CCW
        [[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]], //L->0 //CW
        [[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]]  //L->2 //CCW
    ];
    static readonly i_kicks: [number, number][][] = [
        [[0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2]], //0->R  //CW
        [[0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2]], //R->0  //CCW
        [[0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1]], //R->2  //CW
        [[0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1]], //2->R  //CCW
        [[0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2]], //2->L  //CW
        [[0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2]], //L->2  //CCW
        [[0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1]], //L->0  //CW
        [[0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1]]  //0->L  //CCW
    ];
}

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

    initial_x: number;
    initial_y: number;

    piece_type: string;

    previous_render_rotation: number;


    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.initial_x = x;
        this.initial_y = y;
        this.rotation = 0;
        this.segments = [];
        for (let i: number = 0; i < 4; i++) {
            this.segments.push(new Segment(0, 0, this));
        }

        this.piece_type = this.constructor.name;
    }

    render(context: CanvasRenderingContext2D, absolute_position: boolean, force_render: boolean = false): void {
        if (absolute_position || this.previous_render_rotation !== this.rotation || force_render) {
            if (this.previous_render_rotation !== this.rotation || force_render) {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            }

            this.previous_render_rotation = this.rotation;

            let oldStyle = context.fillStyle;

            context.fillStyle = this.color;
            for (let i: number = 0; i < this.segments.length; i++) {
                let segment: Segment = this.segments[i];
                if (absolute_position) {
                    context.fillRect((this.x + segment.x) * RENDER_SCALE, (this.y + segment.y) * RENDER_SCALE, RENDER_SCALE, RENDER_SCALE);
                }
                else {
                    //TODO: Don't re-render on rotate, just rotate canvas
                    context.fillRect(segment.x * RENDER_SCALE, segment.y * RENDER_SCALE, RENDER_SCALE, RENDER_SCALE);
                }
            }

            context.fillStyle = oldStyle;
        }

        if (!absolute_position) {
            context.canvas.style.left = "" + (this.x * RENDER_SCALE);
            context.canvas.style.top = "" + (this.y * RENDER_SCALE);
        }

    }

    can_move_to(board: Segment[][], x: number, y: number): boolean {
        return this.segments.every((segment) => segment.canParentMove(board, x, y) );
    }

    rotate(cw: boolean): boolean {
        let before: number = this.rotation;
        this.rotation += cw ? 90 : -90;
        while (this.rotation >= 360) {
            this.rotation -= 360;
        }
        while (this.rotation < 0) {
            this.rotation += 360;
        }

        this.rotate_to_rotation();

        let success: boolean = this.kick(before, this.rotation);
        if (!success) {
            this.rotation = before;
            this.rotate_to_rotation();
        }
        else {
            this.handle_ghost();
        }
        return success;
    }
    rotate_to_rotation(): void {
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
    }
    abstract rotate_to_0(): void;
    abstract rotate_to_90(): void;
    abstract rotate_to_180(): void;
    abstract rotate_to_270(): void;

    reinit(): void {
        this.x = this.initial_x;
        this.y = this.initial_y;
        this.rotate_to_0();
        this.handle_ghost();
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
            if (!this.ghost.can_move_to(board, this.ghost.x, y)) {
                break;
            }
        }
        this.ghost.y = y - 1;
        this.ghost.rotation = this.rotation;
    }

    kick(before: number, after: number): boolean {
        if (this.can_move_to(board, this.x, this.y)) { return true; }
        if (this instanceof J_Piece || this instanceof L_Piece || this instanceof S_Piece || this instanceof Z_Piece || this instanceof T_Piece) { return this.srs_jlstz_kick(before, after); }
        if (this instanceof I_Piece) { return this.srs_i_kick(before, after); }
        return false;
    }
    srs_jlstz_kick(before: number, after: number): boolean {
        return this.try_kick_set(this.find_kick_set(SRS.jlstz_kicks, before, after));
    }
    srs_i_kick(before: number, after: number): boolean {
        return this.try_kick_set(this.find_kick_set(SRS.i_kicks, before, after));
    }
    find_kick_set(all_kicks: [number, number][][], before: number, after: number): [number, number][] {
        let CCW_OFFSET: boolean = !((after === 0 && before === 270) || after > before) && !(before === 0 && after === 270);
        let ROT_OFFSET: number = before / 90 * 2;
        let i: number = ROT_OFFSET + (CCW_OFFSET ? 1 : 0);
        return all_kicks[i];
    }
    try_kick_set(kicks: [number, number][]): boolean {
        for (let kick of kicks) {
            if (this.can_move_to(board, this.x + kick[0], this.y + kick[1])) {
                this.x += kick[0];
                this.y += kick[1];
                return true;
            }
        }
        return false;
    }

    try_move(change: number, horizontal: boolean, from_current: boolean = true): boolean {
        let continue_cond;
        let inc;

        let start: number = horizontal ? this.x : this.y;
        let end: number = start;
        if (from_current) {
            end += change;
            inc = function () { start += Math.sign(change) }
            if (change > 0) {
                continue_cond = function () {
                    return start <= end;
                };
            }
            else {
                continue_cond = function () {
                    return start >= end;
                };
            }
        }
        else {
            start += change;
            inc = function () { start -= Math.sign(change) }
            if (change > 0) {
                continue_cond = function () {
                    return start >= end;
                };
            }
            else {
                continue_cond = function () {
                    return start <= end;
                };
            }
        }

        let last_good: number = start;
        for (; continue_cond(); inc()) {
            if (!this.can_move_to(board, horizontal ? start : this.x, horizontal ? this.y : start)) {
                break;
            }
            else {
                last_good = start;
            }
        }
        if (last_good !== start) {
            this.move_to(horizontal ? last_good : this.x, horizontal ? this.y : last_good);
            return true;
        }
        return false;
    }
    move(x_change: number, y_change: number): void {
        this.move_to(this.x + x_change, this.y + y_change);
    }
    move_to(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.handle_ghost();
        board_dirty = true;
    }
}

class Ghost_Piece extends Piece {
    rotate_to_0(): void { }
    rotate_to_90(): void { }
    rotate_to_180(): void { }
    rotate_to_270(): void { }
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

    rotate_to_0(): void { }
    rotate_to_90(): void { }
    rotate_to_180(): void { }
    rotate_to_270(): void { }
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
abstract class RandomPieces {
    abstract peek(index: number): Piece;

    abstract pop(): Piece;

    all_pieces(): Piece[] {
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

    available_pieces(): Piece[] {
        let arr: Piece[] = [];

        if (o_piece) { arr.push(new O_Piece()); }
        if (s_piece) { arr.push(new S_Piece()); }
        if (z_piece) { arr.push(new Z_Piece()); }
        if (l_piece) { arr.push(new L_Piece()); }
        if (j_piece) { arr.push(new J_Piece()); }
        if (t_piece) { arr.push(new T_Piece()); }
        if (i_piece) { arr.push(new I_Piece()); }

        return arr;
    }

    abstract ensure_available(index: number): void;

    abstract clear(): void;
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
            let pieces: Piece[] = this.available_pieces();
            let i: number = Math.floor(Math.random() * pieces.length);
            let new_piece: Piece = pieces[i];
            if (new_piece) {
                this.random_queue.push(new_piece);
            }
        }
    }

    clear() {
        this.random_queue = [];
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
            let pieces: Piece[] = this.available_pieces();
            shuffleArray(pieces);
            this.bag_queue = this.bag_queue.concat(pieces);
        }
    }

    clear() {
        this.bag_queue = [];
    }
}


function fixed_update(): void {
    let now = window.performance.now();
    delta_time = now - last_update_time;
    last_update_time = now;

    //if (DEBUG_MODE) {
    //    update_times.push(delta_time);
    //    if (update_times.length > UPDATES_TO_TRACK) {
    //        update_times.shift();
    //    }

    //    debug_text.innerText = "delta_time " + delta_time + "\r\n";
    //    debug_text.innerText += "instantaneous_ups " + (1000 / delta_time) + "\r\n";
    //    let total_time: number = 0;
    //    for (let t of update_times) {
    //        total_time += t;
    //    }
    //    debug_text.innerText += UPDATES_TO_TRACK + "_update_mspu " + (total_time / update_times.length) + "\r\n";
    //    debug_text.innerText += UPDATES_TO_TRACK + "_update_ups " + (1000/(total_time / update_times.length)) + "\r\n";
    //    let debug_str: string = "controller: " + stringify(controller, null, "\t") + "\r\n";
    //    debug_text.innerText += debug_str;
    //}

    if (DEBUG_MODE) {
        debug_text.innerText = "";
    }

    if (current_piece) {
        slide_repeat();
        gravity();
    }

    //if (DEBUG_MODE) {
    //    debug_text.innerText += "current_piece: " + stringify(current_piece, null, "\t") + "\r\n";
    //    debug_text.innerText += "static pieces: " + static_pieces.length + "\r\n";

    //    let then = window.performance.now();
    //    debug_text.innerText += "update took " + (then - now) + "\r\n";
    //}

    render();
}

function responsive_update(): void {
    if (current_piece) {
        if (controller.hold) {
            hold();
        }
        if (controller.left_down || controller.right_down) {
            slide();
        }
        if ((controller.left_up && !repeat_right) || (controller.right_up && repeat_right)) {
            DAS_countdown = -1;
            ARR_countdown = -1;
        }
        if (controller.hard_drop) {
            hard_drop();
        }
        if (controller.rotate_cw || controller.rotate_ccw) {
            rotate();
        }

        render();
    }
}


function slide(): void {
    let translate: number = 0;
    if (controller.left_down) {
        translate--;
        DAS_countdown = DAS;
        repeat_right = false;
        controller.left_down = false;
        controller.left_up = false;
    }
    else if (controller.right_down) {
        translate++;
        DAS_countdown = DAS;
        repeat_right = true
        controller.right_down = false;
        controller.right_up = false;
    }

    current_piece.try_move(translate, true);
}

function slide_repeat(): void {
    if (DAS_countdown !== -1 && ARR_countdown === -1) {
        DAS_countdown -= delta_time;
        if (DAS_countdown < 0) {
            ARR_countdown = ARR;
        }
    }
    if (ARR_countdown !== -1) {
        if (ARR === 0) {
            current_piece.try_move(repeat_right ? BOARD_WIDTH : -BOARD_WIDTH, true);
        }
        else {
            ARR_countdown -= delta_time;
            if (ARR_countdown < 0) {
                ARR_countdown = ARR;
                current_piece.try_move(repeat_right ? 1 : -1, true);
            }
        }
    }

    //if (DEBUG_MODE) {
    //    debug_text.innerText += "DAS: " + DAS_countdown + "/" + DAS + "\r\n";
    //    debug_text.innerText += "ARR: " + ARR_countdown + "/" + ARR + "\r\n";
    //}
}

function rotate(): void {
    if (controller.rotate_cw) {
        if (current_piece.rotate(true)) {
            board_dirty = true;
            if (lock_countdown !== -1) {
                lock_countdown = LOCK_DELAY;
            }
        }
        controller.rotate_cw = false;
    }
    else if (controller.rotate_ccw) {
        if (current_piece.rotate(false)) {
            board_dirty = true;
            if (lock_countdown !== -1) {
                lock_countdown = LOCK_DELAY;
            }
        }
        controller.rotate_ccw = false;
    }
}

function gravity(): void {
    if (current_piece) {
        if (!current_piece.can_move_to(board, current_piece.x, current_piece.y + 1)) {
            IG = 0;
            if (lock_countdown !== -1) {
                lock_countdown -= delta_time;
                if (lock_countdown <= 0) {
                    solidify()
                }
            }
            else {
                lock_countdown = LOCK_DELAY;
            }
        }
        else {
            lock_countdown = -1;
            let IG_change: number = (delta_time / 16.66) * gravity_speed; //Updates_completed / updates_per_block == blocks_to_move
            if (controller.soft_drop) {
                IG_change *= soft_drop_multiplier;
            }
            IG += IG_change;

            let to_move = Math.floor(IG);

            if (to_move) {
                let before: number = current_piece.y;
                if (current_piece.can_move_to(board, current_piece.x, current_piece.y + to_move)) {
                    board_dirty = true;
                    IG -= to_move;
                    current_piece.y += to_move;
                }
                else {
                    if (current_piece.try_move(to_move, false)) {
                        board_dirty = true;
                        IG -= current_piece.y - before;
                    }
                }
                if (!current_piece.can_move_to(board, current_piece.x, current_piece.y + 1)) {
                    lock_countdown = LOCK_DELAY;
                }
            }
        }
    } 
    //if(DEBUG_MODE) {
    //    debug_text.innerText += "IG: " + IG + "\r\n";
    //    debug_text.innerText += "Lock Delay: " + lock_countdown + "/" + LOCK_DELAY + "\r\n";
    //}
}

function hard_drop(): void {
    if (current_piece.try_move(BOARD_HEIGHT - current_piece.y, false)) {
        board_dirty = true;
    }
    controller.hard_drop = false;
    solidify();
}


function render(): void {
    //let b = window.performance.now();
    if (board_dirty) {
        render_dynamic_board();
        board_dirty = false;
    }
    if (static_dirty) {
        render_static_board(); 
        static_dirty = false;
    }
    //let a = window.performance.now();
    //debug_text_3.innerText += "," + (a-b);
}

function render_dynamic_board(): void {
    if (current_piece) {
        current_piece.ghost.render(ghost_ctx, false);
        current_piece.render(piece_ctx, false);
    }
}

function render_static_board(): void {
    static_piece_ctx.clearRect(0, 0, static_piece_ctx.canvas.width, static_piece_ctx.canvas.height);
    for (let p of static_pieces) {
        p.render(static_piece_ctx, true);
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
    lock_countdown = -1;
    current_piece.render(piece_ctx, false, true);
    current_piece.ghost.render(ghost_ctx, false, true);
    check_alive();
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
        }
        add_line(rows_to_clear.length);

        //TODO: Don't re-render the whole board, splice together the board
        static_dirty = true;
    }
    else {
        //TODO: Don't re-render the whole board, splice together the board
        static_dirty = true;
    }

    new_piece();
}

function hold(): void {
    if (controller.hold) {
        if (held_piece) {
            let temp: Piece = current_piece;
            current_piece = held_piece;
            held_piece = temp;
            current_piece.reinit();
            current_piece.render(piece_ctx, false, true);
            current_piece.ghost.render(ghost_ctx, false, true);
            check_alive();
        }
        else {
            held_piece = current_piece;
            new_piece();
        }
        controller.hold = false;
    }
}

function check_alive(): void {
    if (!current_piece.can_move_to(board, this.x, this.y)) {
        //Dead
        reset();
    }
}


function reset(): void {
    piece_random.clear();
    current_piece = null;
    controller.clear();
    new_board();
    held_piece = null;
    new_piece();
}

function new_board(): void {
    board = [];
    for (let x: number = 0; x < BOARD_WIDTH; x++) {
        board[x] = []
        for (let y: number = 0; y < BOARD_HEIGHT; y++) {
            board[x][y] = null;
        }
    }
    static_pieces = [];
}


function on_load(): void {
    new_board();
    piece_random = new RandomBag();
    IG = 0;
    controller = new Controller();
    controller_map = new ControllerMap();
    lines_cleared = 0;
    total_lines_cleared = 0;
    o_piece = true;
    s_piece = false;
    z_piece = false;
    l_piece = false;
    j_piece = false;
    t_piece = false;
    i_piece = false;


    debug_text = <HTMLDivElement>document.getElementById("debug_text");
    debug_text_2 = <HTMLDivElement>document.getElementById("debug_text_2");
    debug_text_3 = <HTMLDivElement>document.getElementById("debug_text_3");
    board_background = <HTMLDivElement>document.getElementById("board_background");
    board_container = <HTMLDivElement>document.getElementById("board_container");
    lines_stat = <HTMLDivElement>document.getElementById("lines_stat");
    purchases = <HTMLDivElement>document.getElementById("purchases");

    init_unlocks();
    update_stats();

    prepare_canvases();
    render_grid();

    start_key_listener();

    new_piece();

    start_time = window.performance.now();
    last_update_time = start_time;
    setInterval(fixed_update, 0); //0 usually becomes forced to a minimum of 10 by the browser

    //window.onscroll = function () { window.scrollTo(0, 0);}
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

    let w: number = (BOARD_WIDTH * RENDER_SCALE) + GRID_LINE_WIDTH;
    let h: number = (BOARD_HEIGHT * RENDER_SCALE) + GRID_LINE_WIDTH;

    let grid_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = w;
    grid_ctx.canvas.height = h;

    let board_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("piece_board");
    piece_ctx = board_obj.getContext("2d");
    piece_ctx.canvas.width = RENDER_SCALE*4;
    piece_ctx.canvas.height = RENDER_SCALE * 4;

    let ghost_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("ghost_board");
    ghost_ctx = ghost_obj.getContext("2d");
    ghost_ctx.canvas.width = RENDER_SCALE * 4;
    ghost_ctx.canvas.height = RENDER_SCALE * 4;
    ghost_ctx.globalAlpha = 0.3;

    let static_board_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("static_board");
    static_piece_ctx = static_board_obj.getContext("2d");
    static_piece_ctx.canvas.width = w;
    static_piece_ctx.canvas.height = h;

    if (GRID_LINE_WIDTH % 2) {
        //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
        grid_ctx.translate(0.5, 0.5); 
        piece_ctx.translate(0.5, 0.5);
        ghost_ctx.translate(0.5, 0.5);
        static_piece_ctx.translate(0.5, 0.5);
    }

    board_background.style.width = ""+w;
    board_background.style.height = ""+h;

    board_container.style.width = ""+w;
    board_container.style.height = ""+h;
    board_container.style.flexBasis = ""+w;
}

function start_key_listener(): void {
    document.addEventListener("keydown", function (event) {
        let code: number = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        //Ignore (OS) repeated inputs
        if ((code === controller_map.left && controller.left_hold) || (code === controller_map.right && controller.right_hold)) {
            return;
        }
        update_controller(code, true);

        responsive_update();
    });
    document.addEventListener("keyup", function (event) {
        let code: number = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, false);

        responsive_update();
    });
}

function update_controller(keyCode: number = null, isDown: boolean = null): void {
    if (keyCode) {
        let name: string = controller_map.get_name_from_code(keyCode);
        if (name === null) {
            //console.log("unsupported keycode " + keyCode);
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


function add_line(number: number = 1) {
    lines_cleared += number;
    total_lines_cleared += number;
    update_stats();
    update_unlocks();
}

function init_unlocks(): void {
    unpurchased_purchases = [];
    purchased_purchases = [];
    visible_purchases = [];

    unpurchased_purchases.push(new Purchase("Unlock S/Z", 5, 10, () => { s_piece = true; z_piece = true; }));
}

function update_stats(): void {
    lines_stat.innerText = "" + lines_cleared;
}

function update_unlocks(): void {
    for (let p of unpurchased_purchases) {
        if (p.visible_at <= total_lines_cleared) {
            if (!visible_purchases.some((p1) => p1 === p)) {
                add_unlock(p);
            }
        }
    }
}

function add_unlock(purchase: Purchase) {
    let btn: HTMLButtonElement = document.createElement("button");
    purchases.appendChild(btn);
    btn.innerText = purchase.name + ": " + purchase.price;
    btn.addEventListener("click", (e) => {
        if (lines_cleared >= purchase.price) {
            lines_cleared -= purchase.price;
            purchase.buy_logic();
            btn.remove();
            unpurchased_purchases.splice(unpurchased_purchases.indexOf(purchase), 1);
            visible_purchases.splice(visible_purchases.indexOf(purchase), 1);
            purchased_purchases.push(purchase);
        }
    });
    visible_purchases.push(purchase);
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