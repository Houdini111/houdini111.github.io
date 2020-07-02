const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const RENDER_SCALE = 35;
const GRID_LINE_WIDTH = 1;
const DEBUG_MODE = true;
//Page objects
let grid_ctx;
let board_ctx;
let static_board_ctx;
let board_background;
let debug_text;
//Play values
let board;
let controller;
let controller_map;
let piece_random;
let current_piece;
let static_pieces;
let start_time;
let last_update_time;
let delta_time;
let IG;
let gravity_speed = 1 / 64; //64 ticks per block, not a const since it could increase
let soft_drop_multiplier = 6;
//Control values
class Controller {
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
    press(name) {
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
    release(name) {
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
    update() {
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
    constructor() {
        this.left = 37; //L Arrow
        this.right = 39; //R Arrow
        this.rotate_cw = 88; //X
        this.rotate_ccw = 90; //Z
        this.hold = -2; //Shift (like control) is a special case, so I'm storing it as a negative
        this.soft_drop = 40; //D Arrow
        this.hard_drop = 32; //Space
    }
    get_name_from_code(code) {
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
    constructor(x, y, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
    }
    canParentMove(board, parent_x, parent_y) {
        //Useful for translation (gravity/slide)
        return this.canIMove(board, this.x, this.y, parent_x, parent_y);
    }
    canIMove(board, my_x, my_y, parent_x = this.parent.x, parent_y = this.parent.y) {
        //Useful for rotation (including kicks)
        let new_x = parent_x + my_x;
        let new_y = parent_y + my_y;
        if (new_x < 0 || new_x >= BOARD_WIDTH) {
            return false;
        }
        if (new_y >= BOARD_HEIGHT) {
            return false;
        }
        if (new_x >= board.length) {
            return true;
        }
        if (new_y >= board[new_x].length) {
            return true;
        }
        return board[new_x][new_y] == null;
    }
}
class Piece {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.segments = [];
        for (let i = 0; i < 4; i++) {
            this.segments.push(new Segment(0, 0, this));
        }
    }
    render(context) {
        let oldStyle = context.fillStyle;
        context.fillStyle = this.color;
        for (let i = 0; i < this.segments.length; i++) {
            let segment = this.segments[i];
            context.fillRect((this.x + segment.x) * RENDER_SCALE, (this.y + segment.y) * RENDER_SCALE, RENDER_SCALE, RENDER_SCALE);
        }
        context.fillStyle = oldStyle;
    }
    canMove(board, x, y) {
        return this.segments.every((segment) => segment.canParentMove(board, x, y));
    }
    rotate(cw) {
        this.rotation += cw ? 90 : -90;
        while (this.rotation >= 360) {
            this.rotation -= 360;
        }
        while (this.rotation < 0) {
            this.rotation += 360;
        }
        switch (this.rotation) {
            case 0:
                this.rotate_to_0();
                break;
            case 90:
                this.rotate_to_90();
                break;
            case 180:
                this.rotate_to_180();
                break;
            case 270:
                this.rotate_to_270();
                break;
        }
        this.handle_ghost();
    }
    rotate_to_0() {
    }
    rotate_to_90() {
    }
    rotate_to_180() {
    }
    rotate_to_270() {
    }
    make_ghost() {
        this.ghost = new Piece(this.x, this.y);
        this.ghost.color = this.color;
    }
    handle_ghost() {
        this.ghost.x = this.x;
        this.ghost.y = this.y;
        for (let i = 0; i < this.segments.length; i++) {
            this.ghost.segments[i].x = this.segments[i].x;
            this.ghost.segments[i].y = this.segments[i].y;
        }
        let y = this.ghost.y;
        for (; y < BOARD_HEIGHT; y++) {
            if (!this.ghost.canMove(board, this.ghost.x, y)) {
                break;
            }
        }
        this.ghost.y = y - 1;
    }
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
    rotate_to_0() {
        this.segments[0].x = 0;
        this.segments[0].y = 1;
        this.segments[1].x = 1;
        this.segments[1].y = 1;
        this.segments[2].x = 2;
        this.segments[2].y = 1;
        this.segments[3].x = 3;
        this.segments[3].y = 1;
    }
    rotate_to_90() {
        this.segments[0].x = 2;
        this.segments[0].y = 0;
        this.segments[1].x = 2;
        this.segments[1].y = 1;
        this.segments[2].x = 2;
        this.segments[2].y = 2;
        this.segments[3].x = 2;
        this.segments[3].y = 3;
    }
    rotate_to_180() {
        this.segments[0].x = 0;
        this.segments[0].y = 2;
        this.segments[1].x = 1;
        this.segments[1].y = 2;
        this.segments[2].x = 2;
        this.segments[2].y = 2;
        this.segments[3].x = 3;
        this.segments[3].y = 2;
    }
    rotate_to_270() {
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
    rotate_to_0() {
        this.segments[1].x = 0;
        this.segments[1].y = 1;
        this.segments[2].x = 1;
        this.segments[2].y = 0;
        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }
    rotate_to_90() {
        this.segments[1].x = 1;
        this.segments[1].y = 0;
        this.segments[2].x = 2;
        this.segments[2].y = 1;
        this.segments[3].x = 1;
        this.segments[3].y = 2;
    }
    rotate_to_180() {
        this.segments[1].x = 2;
        this.segments[1].y = 1;
        this.segments[2].x = 1;
        this.segments[2].y = 2;
        this.segments[3].x = 0;
        this.segments[3].y = 1;
    }
    rotate_to_270() {
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
    rotate_to_0() {
        this.segments[0].x = 0;
        this.segments[0].y = 1;
        this.segments[2].x = 1;
        this.segments[2].y = 0;
        this.segments[3].x = 2;
        this.segments[3].y = 0;
    }
    rotate_to_90() {
        this.segments[0].x = 1;
        this.segments[0].y = 0;
        this.segments[2].x = 2;
        this.segments[2].y = 1;
        this.segments[3].x = 2;
        this.segments[3].y = 2;
    }
    rotate_to_180() {
        this.segments[0].x = 2;
        this.segments[0].y = 1;
        this.segments[2].x = 1;
        this.segments[2].y = 2;
        this.segments[3].x = 0;
        this.segments[3].y = 2;
    }
    rotate_to_270() {
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
    rotate_to_0() {
        this.segments[0].x = 0;
        this.segments[0].y = 0;
        this.segments[1].x = 1;
        this.segments[1].y = 0;
        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }
    rotate_to_90() {
        this.segments[0].x = 2;
        this.segments[0].y = 0;
        this.segments[1].x = 2;
        this.segments[1].y = 1;
        this.segments[3].x = 1;
        this.segments[3].y = 2;
    }
    rotate_to_180() {
        this.segments[0].x = 2;
        this.segments[0].y = 2;
        this.segments[1].x = 1;
        this.segments[1].y = 2;
        this.segments[3].x = 0;
        this.segments[3].y = 1;
    }
    rotate_to_270() {
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
    rotate_to_0() {
        this.segments[0].x = 0;
        this.segments[0].y = 0;
        this.segments[1].x = 0;
        this.segments[1].y = 1;
        this.segments[3].x = 2;
        this.segments[3].y = 1;
    }
    rotate_to_90() {
        this.segments[0].x = 2;
        this.segments[0].y = 0;
        this.segments[1].x = 1;
        this.segments[1].y = 0;
        this.segments[3].x = 1;
        this.segments[3].y = 2;
    }
    rotate_to_180() {
        this.segments[0].x = 2;
        this.segments[0].y = 2;
        this.segments[1].x = 2;
        this.segments[1].y = 1;
        this.segments[3].x = 0;
        this.segments[3].y = 1;
    }
    rotate_to_270() {
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
    rotate_to_0() {
        this.segments[0].x = 0;
        this.segments[0].y = 1;
        this.segments[2].x = 2;
        this.segments[2].y = 1;
        this.segments[3].x = 2;
        this.segments[3].y = 0;
    }
    rotate_to_90() {
        this.segments[0].x = 1;
        this.segments[0].y = 0;
        this.segments[2].x = 1;
        this.segments[2].y = 2;
        this.segments[3].x = 2;
        this.segments[3].y = 2;
    }
    rotate_to_180() {
        this.segments[0].x = 2;
        this.segments[0].y = 1;
        this.segments[2].x = 0;
        this.segments[2].y = 1;
        this.segments[3].x = 0;
        this.segments[3].y = 2;
    }
    rotate_to_270() {
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
    peek(index) {
        return null;
    }
    pop() {
        return null;
    }
    piece_array() {
        let arr = [];
        arr.push(new O_Piece());
        arr.push(new I_Piece());
        arr.push(new T_Piece());
        arr.push(new S_Piece());
        arr.push(new Z_Piece());
        arr.push(new J_Piece());
        arr.push(new L_Piece());
        return arr;
    }
    ensure_available(index) {
    }
}
class TrueRandom extends RandomPieces {
    constructor() {
        super(...arguments);
        this.random_queue = [];
    }
    peek(index) {
        this.ensure_available(index);
        return this.random_queue[index];
    }
    pop() {
        this.ensure_available(0);
        return this.random_queue.pop();
    }
    ensure_available(index) {
        while (this.random_queue.length - 1 < index) {
            let i = Math.floor(Math.random() * 7);
            let new_piece = null;
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
    constructor() {
        super(...arguments);
        this.bag_queue = [];
    }
    peek(index) {
        this.ensure_available(index);
        return this.bag_queue[index];
    }
    pop() {
        this.ensure_available(0);
        return this.bag_queue.pop();
    }
    ensure_available(index) {
        if (this.bag_queue.length - 1 < index) {
            let pieces = this.piece_array();
            shuffleArray(pieces);
            this.bag_queue = this.bag_queue.concat(pieces);
        }
    }
}
function update() {
    let now = Date.now();
    delta_time = now - last_update_time;
    last_update_time = now;
    if (DEBUG_MODE) {
        debug_text.innerText = "";
        let debug_str = "controller: " + stringify(controller, null, "\t") + "\r\n";
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
    update_controller();
    render_dynamic_board();
}
function slide() {
    let translate = 0;
    if (controller.left_down) {
        translate--;
    }
    else if (controller.right_down) {
        translate++;
    }
    if (translate !== 0) {
        if (current_piece.canMove(board, current_piece.x + translate, current_piece.y)) {
            current_piece.x += translate;
        }
    }
    current_piece.handle_ghost();
}
function rotate() {
    if (controller.rotate_cw) {
        current_piece.rotate(true);
    }
    else if (controller.rotate_ccw) {
        current_piece.rotate(false);
    }
}
function gravity() {
    if (current_piece) {
        if (controller.hard_drop) {
            for (let y = current_piece.y; y < BOARD_HEIGHT; y++) {
                if (!current_piece.canMove(board, current_piece.x, y)) {
                    current_piece.y = y - 1;
                    break;
                }
            }
            solidify();
        }
        else {
            let IG_change = (delta_time / 16.66) * gravity_speed; //Updates_completed / updates_per_block == blocks_to_move
            if (controller.soft_drop) {
                IG_change *= soft_drop_multiplier;
            }
            IG += IG_change;
            let to_move = Math.floor(IG);
            if (to_move) {
                let y = current_piece.y + to_move;
                for (; y > current_piece.y; y--) {
                    if (current_piece.canMove(board, current_piece.x, y)) {
                        current_piece.y += to_move;
                        IG -= to_move;
                    }
                }
                if (y === current_piece.y) {
                    solidify();
                }
            }
        }
    }
    if (DEBUG_MODE) {
        debug_text.innerText += "IG: " + IG + "\r\n";
    }
}
function render_dynamic_board() {
    if (current_piece) {
        board_ctx.clearRect(0, 0, board_ctx.canvas.width, board_ctx.canvas.height);
        board_ctx.globalAlpha = 0.5;
        current_piece.ghost.render(board_ctx);
        board_ctx.globalAlpha = 1;
        current_piece.render(board_ctx);
    }
}
function render_static_board() {
    static_board_ctx.clearRect(0, 0, static_board_ctx.canvas.width, static_board_ctx.canvas.height);
    for (let p of static_pieces) {
        p.render(static_board_ctx);
    }
}
function render_grid() {
    if (GRID_LINE_WIDTH === 0) {
        return;
    }
    grid_ctx.strokeStyle = "#000000";
    grid_ctx.lineWidth = GRID_LINE_WIDTH;
    let w = grid_ctx.canvas.width;
    let h = grid_ctx.canvas.height;
    grid_ctx.clearRect(0, 0, grid_ctx.canvas.width, grid_ctx.canvas.height);
    for (let x = (GRID_LINE_WIDTH / 2 | 0); x < w; x += RENDER_SCALE) {
        grid_ctx.moveTo(x, 0);
        grid_ctx.lineTo(x, h);
    }
    for (let y = (GRID_LINE_WIDTH / 2 | 0); y < h; y += RENDER_SCALE) {
        grid_ctx.moveTo(0, y);
        grid_ctx.lineTo(w, y);
    }
    grid_ctx.stroke();
}
function new_piece() {
    current_piece = piece_random.pop();
    current_piece.handle_ghost();
    IG = 0;
}
function solidify() {
    static_pieces.push(current_piece);
    for (let segment of current_piece.segments) {
        let s_x = segment.x + current_piece.x;
        let s_y = segment.y + current_piece.y;
        board[s_x][s_y] = segment;
    }
    let rows_to_clear = [];
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        let solid = true;
        for (let x = 0; x < BOARD_WIDTH; x++) {
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
        for (let i = 0; i < rows_to_clear.length; i++) {
            let y = rows_to_clear[i];
            for (let x = 0; x < BOARD_WIDTH; x++) {
                let segment = board[x][y];
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
        let b = 0;
        let shift_amt = 1;
        for (let y = rows_to_clear[0] - 1; y >= 0; y--) {
            if (rows_to_clear.some((row) => row === y)) {
                shift_amt++;
            }
            for (let x = 0; x < BOARD_WIDTH; x++) {
                board[x][y + shift_amt] = board[x][y];
                if (board[x][y]) {
                    board[x][y].y += shift_amt;
                    board[x][y] = null;
                }
            }
            b++;
            if (b === 30) {
                break;
            }
        }
        render_static_board();
    }
    else {
        current_piece.render(static_board_ctx);
    }
    new_piece();
}
function on_load() {
    board = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
        board[x] = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            board[x][y] = null;
        }
    }
    static_pieces = [];
    piece_random = new RandomBag();
    IG = 0;
    controller = new Controller();
    controller_map = new ControllerMap();
    debug_text = document.getElementById("debug_text");
    board_background = document.getElementById("board_background");
    prepare_canvases();
    render_grid();
    start_key_listener();
    new_piece();
    start_update_thread();
}
function prepare_canvases() {
    let oldMoveTo = CanvasRenderingContext2D.prototype.moveTo; //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
    CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
        x |= 0;
        y |= 0;
        oldMoveTo.call(this, x, y);
    };
    let oldLineTo = CanvasRenderingContext2D.prototype.lineTo;
    CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
        x |= 0;
        y |= 0;
        oldLineTo.call(this, x, y);
    };
    let odd_offset = GRID_LINE_WIDTH % 2 ? 1 : 0;
    let w = (BOARD_WIDTH * RENDER_SCALE) + GRID_LINE_WIDTH;
    let h = (BOARD_HEIGHT * RENDER_SCALE) + GRID_LINE_WIDTH;
    let grid_obj = document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = w;
    grid_ctx.canvas.height = h;
    let board_obj = document.getElementById("board");
    board_ctx = board_obj.getContext("2d");
    board_ctx.canvas.width = w;
    board_ctx.canvas.height = h;
    let static_board_obj = document.getElementById("static_board");
    static_board_ctx = static_board_obj.getContext("2d");
    static_board_ctx.canvas.width = w;
    static_board_ctx.canvas.height = h;
    if (odd_offset) {
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
        board_ctx.translate(0.5, 0.5);
        static_board_ctx.translate(0.5, 0.5);
    }
    board_background.style.width = "" + w;
    board_background.style.height = "" + h;
}
function start_key_listener() {
    document.addEventListener("keydown", function (event) {
        let code = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, true);
    });
    document.addEventListener("keyup", function (event) {
        let code = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, false);
    });
}
function update_controller(keyCode = null, isDown = null) {
    //TODO ////////// Handle multiple simultaneous presses (soft drop + other)
    if (keyCode) {
        let name = controller_map.get_name_from_code(keyCode);
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
    else {
        controller.update();
    }
}
function start_update_thread() {
    start_time = Date.now();
    last_update_time = start_time;
    setInterval(update, 16.66);
}
//Per https://stackoverflow.com/a/12646864/4698411
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
//Per https://gist.github.com/saitonakamura/d51aa672c929e35cc81fa5a0e31f12a9#gistcomment-3201131
function stringify(obj, replacer, indent) {
    let replaceCircular = function (val, cache = null) {
        cache = cache || new WeakSet();
        if (val && typeof (val) === 'object') {
            if (cache.has(val))
                return '[CircularRef]';
            cache.add(val);
            let obj = (Array.isArray(val) ? [] : {});
            for (var idx in val) {
                //Per https://stackoverflow.com/a/57568856/4698411
                obj[idx] = replaceCircular(val[idx], cache);
            }
            cache.delete(val);
            return obj;
        }
        return val;
    };
    return JSON.stringify(replaceCircular(obj), replacer, indent);
}
;
window.onload = on_load;
//# sourceMappingURL=tetris_incremental.js.map