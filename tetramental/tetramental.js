let board_width = 10;
let board_height = 20;
const RENDER_SCALE = 35;
const GRID_LINE_WIDTH = 1;
const DEBUG_MODE = true;
//Page objects
let grid_ctx;
let piece_ctx;
let ghost_ctx;
let static_piece_ctx;
let board_background;
let board_container;
let debug_text;
let debug_text_2;
let debug_text_3;
let lines_stat;
let purchases;
let board_dirty;
let static_dirty;
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
let update_times = [];
let UPDATES_TO_TRACK = 60;
let IG;
let gravity_speed = 1 / 64; //64 ticks per block, not a const since it could increase
let soft_drop_multiplier = 6;
let ARR = 0; //Auto Repeat Rate in ms
//let ARR: number = 0; //Auto Repeat Rate in frames, can be fractional to indicate multiple moves per frame
let DAS = 150; //Delayed Auto Shift in ms
let ARR_countdown = -1;
let DAS_countdown = -1;
let repeat_right;
let previous_held_for;
let LOCK_DELAY = 500; //Miliseconds before lock
let lock_countdown = -1;
let held_piece;
let lines_cleared;
let total_lines_cleared;
let unpurchased_purchases;
let visible_purchases;
let purchased_purchases;
//Purchases
class Purchase {
    constructor(id, name, visible_at, price, buy_logic, prereq_ids = null) {
        this.id = id;
        this.name = name;
        this.visible_at = visible_at;
        this.price = price;
        this.buy_logic = buy_logic;
        this.prereqs = prereq_ids;
    }
}
//Purchase vars
let o_piece = true;
let s_piece = true;
let z_piece = true;
let l_piece = true;
let j_piece = true;
let t_piece = true;
let i_piece = true;
let left = true;
let right = true;
let gravity = true;
let auto_repeat = true;
let soft_drop = true;
let hard_drop = true;
let hold = true;
let cw = true;
let ccw = true;
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
    release(name) {
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
    clear() {
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
class SRS {
}
//Per https://tetris.wiki/Super_Rotation_System
SRS.jlstz_kicks = [
    [[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]],
    [[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]],
    [[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]],
    [[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]],
    [[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]],
    [[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]],
    [[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]],
    [[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]] //L->2 //CCW
];
SRS.i_kicks = [
    [[0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2]],
    [[0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2]],
    [[0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1]],
    [[0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1]],
    [[0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2]],
    [[0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2]],
    [[0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1]],
    [[0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1]] //0->L  //CCW
];
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
        if (new_x < 0 || new_x >= board_width) {
            return false;
        }
        if (new_y < 0) {
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
    constructor() {
        this.y = board_height - 1;
        let w = 3;
        if (this instanceof I_Piece) {
            w = 4;
            this.y--;
        }
        else if (this instanceof O_Piece) {
            w = 2;
        }
        this.x = Math.floor((board_width - w) / 2);
        this.initial_x = this.x;
        this.initial_y = this.y;
        this.rotation = 0;
        this.segments = [];
        for (let i = 0; i < 4; i++) {
            this.segments.push(new Segment(0, 0, this));
        }
        this.piece_type = this.constructor.name;
    }
    render(context, absolute_position, force_render = false) {
        if (absolute_position || this.previous_render_rotation !== this.rotation || force_render) {
            if (this.previous_render_rotation !== this.rotation || force_render) {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            }
            this.previous_render_rotation = this.rotation;
            let oldStyle = context.fillStyle;
            context.fillStyle = this.color;
            for (let i = 0; i < this.segments.length; i++) {
                let segment = this.segments[i];
                if (absolute_position) {
                    context.fillRect((this.x + segment.x) * RENDER_SCALE, (this.y - board_height + segment.y) * RENDER_SCALE, RENDER_SCALE, RENDER_SCALE);
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
            context.canvas.style.top = "" + ((board_height - this.y - 1) * RENDER_SCALE);
        }
    }
    can_move_to(board, x, y) {
        return this.segments.every((segment) => segment.canParentMove(board, x, y));
    }
    rotate(cw) {
        let before = this.rotation;
        this.rotation += cw ? 90 : -90;
        while (this.rotation >= 360) {
            this.rotation -= 360;
        }
        while (this.rotation < 0) {
            this.rotation += 360;
        }
        this.rotate_to_rotation();
        let success = this.kick(before, this.rotation);
        if (!success) {
            this.rotation = before;
            this.rotate_to_rotation();
        }
        else {
            this.handle_ghost();
        }
        return success;
    }
    rotate_to_rotation() {
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
    }
    reinit() {
        this.x = this.initial_x;
        this.y = this.initial_y;
        this.rotate_to_0();
        this.handle_ghost();
    }
    make_ghost() {
        this.ghost = new Ghost_Piece();
        this.ghost.x = this.x;
        this.ghost.y = this.y;
        this.ghost.color = this.color;
    }
    handle_ghost() {
        if (!this.ghost) {
            return;
        }
        this.ghost.x = this.x;
        this.ghost.y = this.y;
        for (let i = 0; i < this.segments.length; i++) {
            this.ghost.segments[i].x = this.segments[i].x;
            this.ghost.segments[i].y = this.segments[i].y;
        }
        this.ghost.try_move(-board_height, false);
        //let y: number = this.ghost.y;
        //for (; y >= 0; y--) {
        //    if (!this.ghost.can_move_to(board, this.ghost.x, y)) {
        //        break;
        //    }
        //}
        //this.ghost.y = y - 1;
        this.ghost.rotation = this.rotation;
    }
    kick(before, after) {
        if (this.can_move_to(board, this.x, this.y)) {
            return true;
        }
        if (this instanceof J_Piece || this instanceof L_Piece || this instanceof S_Piece || this instanceof Z_Piece || this instanceof T_Piece) {
            return this.srs_jlstz_kick(before, after);
        }
        if (this instanceof I_Piece) {
            return this.srs_i_kick(before, after);
        }
        return false;
    }
    srs_jlstz_kick(before, after) {
        return this.try_kick_set(this.find_kick_set(SRS.jlstz_kicks, before, after));
    }
    srs_i_kick(before, after) {
        return this.try_kick_set(this.find_kick_set(SRS.i_kicks, before, after));
    }
    find_kick_set(all_kicks, before, after) {
        let CCW_OFFSET = !((after === 0 && before === 270) || after > before) && !(before === 0 && after === 270);
        let ROT_OFFSET = before / 90 * 2;
        let i = ROT_OFFSET + (CCW_OFFSET ? 1 : 0);
        return all_kicks[i];
    }
    try_kick_set(kicks) {
        for (let i = 0; i < kicks.length; i++) {
            let kick = kicks[i];
            if (this.can_move_to(board, this.x + kick[0], this.y + kick[1])) {
                this.x += kick[0];
                this.y += kick[1];
                return true;
            }
        }
        return false;
    }
    try_move(change, horizontal, from_current = true) {
        let continue_cond;
        let inc;
        let start = horizontal ? this.x : this.y;
        let end = start;
        if (from_current) {
            end += change;
            inc = function () { start += Math.sign(change); };
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
            inc = function () { start -= Math.sign(change); };
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
        let last_good = start;
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
    move(x_change, y_change) {
        this.move_to(this.x + x_change, this.y + y_change);
    }
    move_to(x, y) {
        this.x = x;
        this.y = y;
        this.handle_ghost();
        board_dirty = true;
    }
}
class Ghost_Piece extends Piece {
    rotate_to_0() { }
    rotate_to_90() { }
    rotate_to_180() { }
    rotate_to_270() { }
}
class O_Piece extends Piece {
    constructor() {
        super();
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
    rotate_to_0() { }
    rotate_to_90() { }
    rotate_to_180() { }
    rotate_to_270() { }
}
class I_Piece extends Piece {
    constructor() {
        super();
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
        super();
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
        super();
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
        super();
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
        super();
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
        super();
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
    all_pieces() {
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
    available_pieces() {
        let arr = [];
        if (o_piece) {
            arr.push(new O_Piece());
        }
        if (s_piece) {
            arr.push(new S_Piece());
        }
        if (z_piece) {
            arr.push(new Z_Piece());
        }
        if (l_piece) {
            arr.push(new L_Piece());
        }
        if (j_piece) {
            arr.push(new J_Piece());
        }
        if (t_piece) {
            arr.push(new T_Piece());
        }
        if (i_piece) {
            arr.push(new I_Piece());
        }
        return arr;
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
        return this.random_queue.shift();
    }
    ensure_available(index) {
        while (this.random_queue.length - 1 < index) {
            let pieces = this.available_pieces();
            let i = Math.floor(Math.random() * pieces.length);
            let new_piece = pieces[i];
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
        return this.bag_queue.shift();
    }
    ensure_available(index) {
        if (this.bag_queue.length - 1 < index) {
            let pieces = this.available_pieces();
            shuffleArray(pieces);
            this.bag_queue = this.bag_queue.concat(pieces);
        }
    }
    clear() {
        this.bag_queue = [];
    }
}
function fixed_update() {
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
        apply_gravity();
    }
    //if (DEBUG_MODE) {
    //    debug_text.innerText += "current_piece: " + stringify(current_piece, null, "\t") + "\r\n";
    //    debug_text.innerText += "static pieces: " + static_pieces.length + "\r\n";
    //    let then = window.performance.now();
    //    debug_text.innerText += "update took " + (then - now) + "\r\n";
    //}
    render();
}
function responsive_update() {
    if (current_piece) {
        if (controller.hold && do_hold) {
            do_hold();
        }
        if ((controller.left_down && left) || (controller.right_down && right)) {
            slide();
        }
        if ((controller.left_up && !repeat_right && auto_repeat) || (controller.right_up && repeat_right && auto_repeat)) {
            DAS_countdown = -1;
            ARR_countdown = -1;
        }
        if (controller.hard_drop) {
            do_hard_drop();
        }
        if (controller.rotate_cw || controller.rotate_ccw) {
            rotate();
        }
        render();
    }
}
function slide() {
    let translate = 0;
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
        repeat_right = true;
        controller.right_down = false;
        controller.right_up = false;
    }
    current_piece.try_move(translate, true);
}
function slide_repeat() {
    if (auto_repeat) {
        if (DAS_countdown !== -1 && ARR_countdown === -1) {
            DAS_countdown -= delta_time;
            if (DAS_countdown < 0) {
                ARR_countdown = ARR;
            }
        }
        if (ARR_countdown !== -1) {
            if (ARR === 0) {
                current_piece.try_move(repeat_right ? board_width : -board_width, true);
            }
            else {
                ARR_countdown -= delta_time;
                if (ARR_countdown < 0) {
                    ARR_countdown = ARR;
                    current_piece.try_move(repeat_right ? 1 : -1, true);
                }
            }
        }
    }
    //if (DEBUG_MODE) {
    //    debug_text.innerText += "DAS: " + DAS_countdown + "/" + DAS + "\r\n";
    //    debug_text.innerText += "ARR: " + ARR_countdown + "/" + ARR + "\r\n";
    //}
}
function rotate() {
    if (controller.rotate_cw && cw) {
        if (current_piece.rotate(true)) {
            board_dirty = true;
            if (lock_countdown !== -1) {
                lock_countdown = LOCK_DELAY;
            }
        }
        controller.rotate_cw = false;
    }
    else if (controller.rotate_ccw && ccw) {
        if (current_piece.rotate(false)) {
            board_dirty = true;
            if (lock_countdown !== -1) {
                lock_countdown = LOCK_DELAY;
            }
        }
        controller.rotate_ccw = false;
    }
}
function apply_gravity() {
    if (current_piece && gravity) {
        if (!current_piece.can_move_to(board, current_piece.x, current_piece.y - 1)) {
            IG = 0;
            if (lock_countdown !== -1) {
                lock_countdown -= delta_time;
                if (lock_countdown <= 0) {
                    solidify();
                }
            }
            else {
                lock_countdown = LOCK_DELAY;
            }
        }
        else {
            lock_countdown = -1;
            let IG_change = (delta_time / 16.66) * gravity_speed; //Updates_completed / updates_per_block == blocks_to_move
            if (controller.soft_drop && soft_drop) {
                IG_change *= soft_drop_multiplier;
            }
            IG += IG_change;
            let to_move = Math.floor(IG);
            if (to_move) {
                let before = current_piece.y;
                if (current_piece.can_move_to(board, current_piece.x, current_piece.y - to_move)) {
                    board_dirty = true;
                    IG -= to_move;
                    current_piece.y -= to_move;
                }
                else {
                    if (current_piece.try_move(-to_move, false)) {
                        board_dirty = true;
                        IG -= current_piece.y - before;
                    }
                }
                if (!current_piece.can_move_to(board, current_piece.x, current_piece.y - 1)) {
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
function do_hard_drop() {
    if (hard_drop) {
        if (current_piece.try_move(current_piece.y, false)) {
            board_dirty = true;
        }
        controller.hard_drop = false;
        solidify();
    }
}
function render() {
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
function render_dynamic_board() {
    if (current_piece) {
        current_piece.ghost.render(ghost_ctx, false);
        current_piece.render(piece_ctx, false);
    }
}
function render_static_board() {
    static_piece_ctx.clearRect(0, 0, static_piece_ctx.canvas.width, static_piece_ctx.canvas.height);
    for (let p of static_pieces) {
        p.render(static_piece_ctx, true);
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
    board_dirty = true;
    IG = 0;
    lock_countdown = -1;
    current_piece.render(piece_ctx, false, true);
    current_piece.ghost.render(ghost_ctx, false, true);
    check_alive();
}
function solidify() {
    static_pieces.push(current_piece);
    for (let segment of current_piece.segments) {
        let s_x = segment.x + current_piece.x;
        let s_y = segment.y + current_piece.y;
        board[s_x][s_y] = segment;
    }
    let rows_to_clear = [];
    for (let y = board_height - 1; y >= 0; y--) {
        let solid = true;
        for (let x = 0; x < board_width; x++) {
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
            for (let x = 0; x < board_width; x++) {
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
        let shift_amt = 1;
        for (let y = rows_to_clear[0] - 1; y >= 0; y--) {
            for (let x = 0; x < board_width; x++) {
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
function do_hold() {
    if (controller.hold) {
        if (held_piece) {
            let temp = current_piece;
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
function check_alive() {
    if (!current_piece.can_move_to(board, this.x, this.y)) {
        //Dead
        reset();
    }
}
function reset() {
    piece_random.clear();
    current_piece = null;
    controller.clear();
    new_board();
    held_piece = null;
    new_piece();
}
function new_board() {
    board = [];
    for (let x = 0; x < board_width; x++) {
        board[x] = [];
        for (let y = 0; y < board_height; y++) {
            board[x][y] = null;
        }
    }
    static_pieces = [];
}
function change_board_size(amount, horizontal) {
    if (amount > 0) {
        if (horizontal) {
            board_width += amount;
            board[board_width - 1] = [];
            for (let y = 0; y < board_height; y++) {
                board[board_width - 1][y] = null;
            }
        }
        else {
            //TODO After origin has been flipped to bottom left from top left
            //board_height += amount;
            //for (let y: number = 0; y < board_height; y++) {
            //    board[board_width - 1][y] = null;
            //}
        }
    }
    else {
        //TODO Handle shrinking the board
    }
    if (horizontal) {
        let w = board_width * RENDER_SCALE;
        grid_ctx.canvas.width = w;
        static_piece_ctx.canvas.width = w;
        board_background.style.width = "" + w;
        board_container.style.width = "" + w;
    }
    else {
        let h = board_height * RENDER_SCALE;
        grid_ctx.canvas.height = h;
        static_piece_ctx.canvas.height = h;
        board_background.style.height = "" + h;
        board_container.style.height = "" + h;
        board_container.style.flexBasis = "" + h;
    }
}
function on_load() {
    new_board();
    piece_random = new RandomBag();
    IG = 0;
    controller = new Controller();
    controller_map = new ControllerMap();
    lines_cleared = 0;
    total_lines_cleared = 0;
    debug_text = document.getElementById("debug_text");
    debug_text_2 = document.getElementById("debug_text_2");
    debug_text_3 = document.getElementById("debug_text_3");
    board_background = document.getElementById("board_background");
    board_container = document.getElementById("board_container");
    lines_stat = document.getElementById("lines_stat");
    purchases = document.getElementById("purchases");
    init_unlocks();
    update_stats();
    prepare_canvases();
    render_grid();
    start_key_listener();
    new_piece(); //Now occurs on first purchase
    //update_purchaes();
    start_time = window.performance.now();
    last_update_time = start_time;
    setInterval(fixed_update, 0); //0 usually becomes forced to a minimum of 10 by the browser
    //window.onscroll = function () { window.scrollTo(0, 0);}
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
    let w = (board_width * RENDER_SCALE) + GRID_LINE_WIDTH;
    let h = (board_height * RENDER_SCALE) + GRID_LINE_WIDTH;
    let grid_obj = document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = w;
    grid_ctx.canvas.height = h;
    let board_obj = document.getElementById("piece_board");
    piece_ctx = board_obj.getContext("2d");
    piece_ctx.canvas.width = RENDER_SCALE * 4;
    piece_ctx.canvas.height = RENDER_SCALE * 4;
    let ghost_obj = document.getElementById("ghost_board");
    ghost_ctx = ghost_obj.getContext("2d");
    ghost_ctx.canvas.width = RENDER_SCALE * 4;
    ghost_ctx.canvas.height = RENDER_SCALE * 4;
    ghost_ctx.globalAlpha = 0.3;
    let static_board_obj = document.getElementById("static_board");
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
    board_background.style.width = "" + w;
    board_background.style.height = "" + h;
    board_container.style.width = "" + w;
    board_container.style.height = "" + h;
    board_container.style.flexBasis = "" + w;
    //ghost_obj.style.visibility = "hidden";
    //board_background.style.visibility = "hidden";
    //grid_obj.style.visibility = "hidden";
}
function start_key_listener() {
    document.addEventListener("keydown", function (event) {
        let code = event.keyCode;
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
        let code = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, false);
        responsive_update();
    });
}
function update_controller(keyCode = null, isDown = null) {
    if (keyCode) {
        let name = controller_map.get_name_from_code(keyCode);
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
function add_line(number = 1) {
    lines_cleared += number;
    total_lines_cleared += number;
    update_stats();
    update_purchaes();
}
function init_unlocks() {
    unpurchased_purchases = [];
    purchased_purchases = [];
    visible_purchases = [];
    unpurchased_purchases.push(new Purchase(0, "Unlock Board", 0, 0, () => { board_background.style.visibility = null; }));
    unpurchased_purchases.push(new Purchase(1, "Unlock S Piece", 0, 0, () => { s_piece = true; new_piece(); }, [0]));
    unpurchased_purchases.push(new Purchase(2, "Unlock Z Piece", 5, 10, () => { z_piece = true; }, [1]));
    unpurchased_purchases.push(new Purchase(3, "Unlock O Piece", 10, 10, () => { o_piece = true; }, [2]));
    unpurchased_purchases.push(new Purchase(4, "Unlock Ghost", 5, 10, () => { ghost_ctx.canvas.style.visibility = null; }, [1]));
    unpurchased_purchases.push(new Purchase(5, "Unlock Grid", 5, 10, () => { grid_ctx.canvas.style.visibility = null; }, [1]));
    unpurchased_purchases.push(new Purchase(7, "Unlock Gravity", 0, 0, () => { gravity = true; }, [1]));
    unpurchased_purchases.push(new Purchase(6, "Unlock Left Movement", 0, 0, () => { left = true; }, [1]));
    unpurchased_purchases.push(new Purchase(8, "Unlock Right Movement", 0, 0, () => { right = true; }, [1]));
    unpurchased_purchases.push(new Purchase(9, "Unlock Auto-Repeat", 10, 15, () => { auto_repeat = true; }, [1]));
    unpurchased_purchases.push(new Purchase(10, "Unlock Soft Drop", 0, 1, () => { soft_drop = true; }, [1]));
    unpurchased_purchases.push(new Purchase(11, "Unlock Hard Drop", 12, 25, () => { hard_drop = true; }, [10]));
    unpurchased_purchases.push(new Purchase(12, "Unlock L Piece", 8, 15, () => { l_piece = true; }, [3]));
    unpurchased_purchases.push(new Purchase(13, "Unlock J Piece", 12, 25, () => { j_piece = true; }, [12]));
    unpurchased_purchases.push(new Purchase(14, "Unlock T Piece", 20, 35, () => { t_piece = true; }, [13]));
    unpurchased_purchases.push(new Purchase(15, "Unlock I Piece", 27, 50, () => { i_piece = true; }, [14]));
    unpurchased_purchases.push(new Purchase(16, "Unlock CW Rotation", 1, 5, () => { cw = true; }, [1]));
    unpurchased_purchases.push(new Purchase(17, "Unlock CCW Rotation", 1, 5, () => { ccw = true; }, [1]));
    unpurchased_purchases.push(new Purchase(18, "Increase board height", 0, 0, () => { change_board_size(1, false); }));
    /*Ideas:
    Lines not for currency (perhaps "minos" instead?)
    Display current controls
    Make controls worse to start (to incentise buying the ability to customize them)
    Make board start smaller (both height and width) [this will help the early game to be not as painful]
      Buy height and width
      Ability to change height/width (incase you change your mind)
      More points (currency) for larger widths, to incentivise their use (e.g., 6 wide == 10 while 7 wide == 12)
    Color
    SFX
    Music
    Lock Delay
    Kicks
    Toggle Ghost
    An auto-player?
    Pausing
    The ability to customize
      ARR
      DAS
      Soft drop multiplier
      Controls
      etc.
    "multiplayer"?
      where KOs grant extra points
      and maybe garbage does too
    Or, perhaps, just auto-generate garbage which is worth more
    Unlockable bonus points for spins
    Line clear animations
    The ability to skip a piece?
    Customizable grid
      width
      color
      transparency
      style (dotted)
    Customizable background
    Sonic drops
    180 spins
    Customizable render scale
    */
}
function update_stats() {
    lines_stat.innerText = "" + lines_cleared;
}
function update_purchaes() {
    for (let p of unpurchased_purchases) {
        if (p.visible_at <= total_lines_cleared) {
            if (!visible_purchases.some((p1) => p1 === p)) {
                if (p.prereqs === null || p.prereqs.every(p_id => purchased_purchases.some(pp => pp.id === p_id))) {
                    add_purchase(p);
                }
            }
        }
    }
}
function add_purchase(purchase) {
    let btn = document.createElement("button");
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
            update_stats();
            update_purchaes();
        }
    });
    visible_purchases.push(purchase);
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
//# sourceMappingURL=tetramental.js.map