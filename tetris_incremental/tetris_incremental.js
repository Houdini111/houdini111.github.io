var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BOARD_WIDTH = 10;
var BOARD_HEIGHT = 20;
var RENDER_SCALE = 35;
var GRID_LINE_WIDTH = 1;
var DEBUG_MODE = true;
//Page objects
var grid_ctx;
var board_ctx;
var board_background;
var debug_text;
//Play values
var controller;
var controller_map;
var start_time;
var last_update_time;
var current_piece;
var delta_time;
var piece_random;
var IG;
var gravity_speed = 1 / 64; //64 ticks per block, not a const since it could increase
//Control values
var Controller = /** @class */ (function () {
    function Controller() {
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
    Controller.prototype.press = function (name) {
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
    };
    Controller.prototype.release = function (name) {
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
    };
    Controller.prototype.update = function () {
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
    };
    return Controller;
}());
var ControllerMap = /** @class */ (function () {
    function ControllerMap() {
        this.left = 37; //L Arrow
        this.right = 39; //R Arrow
        this.rotate_cw = 88; //X
        this.rotate_ccw = -1; //Z
        this.hold = -2; //Shift (like control) is a special case, so I'm storing it as a negative
        this.soft_drop = 40; //D Arrow
        this.hard_drop = 32; //Space
    }
    ControllerMap.prototype.get_name_from_code = function (code) {
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
    };
    return ControllerMap;
}());
//Game objects
var Segment = /** @class */ (function () {
    function Segment(x, y) {
        this.x = x;
        this.y = y;
    }
    return Segment;
}());
var Piece = /** @class */ (function () {
    function Piece(x, y) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.segments = new Array();
        for (var i = 0; i < 4; i++) {
            this.segments.push(new Segment(0, 0));
        }
    }
    Piece.prototype.render = function (context) {
        var oldStyle = context.fillStyle;
        context.fillStyle = this.color;
        for (var i = 0; i < this.segments.length; i++) {
            var segment = this.segments[i];
            context.fillRect((this.x + segment.x) * RENDER_SCALE, (this.y + segment.y) * RENDER_SCALE, RENDER_SCALE, RENDER_SCALE);
        }
        context.fillStyle = oldStyle;
    };
    return Piece;
}());
var O_Piece = /** @class */ (function (_super) {
    __extends(O_Piece, _super);
    function O_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#FFFF00";
        _this.segments[0].x = 0;
        _this.segments[0].y = 0;
        _this.segments[1].x = 1;
        _this.segments[1].y = 0;
        _this.segments[2].x = 0;
        _this.segments[2].y = 1;
        _this.segments[3].x = 1;
        _this.segments[3].y = 1;
        return _this;
    }
    return O_Piece;
}(Piece));
var I_Piece = /** @class */ (function (_super) {
    __extends(I_Piece, _super);
    function I_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#00FFFF";
        _this.segments[0].x = 0;
        _this.segments[0].y = 1;
        _this.segments[1].x = 1;
        _this.segments[1].y = 1;
        _this.segments[2].x = 2;
        _this.segments[2].y = 1;
        _this.segments[3].x = 3;
        _this.segments[3].y = 1;
        return _this;
    }
    return I_Piece;
}(Piece));
var T_Piece = /** @class */ (function (_super) {
    __extends(T_Piece, _super);
    function T_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#FF00FF";
        _this.segments[0].x = 1;
        _this.segments[0].y = 1;
        _this.segments[1].x = 0;
        _this.segments[1].y = 1;
        _this.segments[2].x = 1;
        _this.segments[2].y = 0;
        _this.segments[3].x = 2;
        _this.segments[3].y = 1;
        return _this;
    }
    return T_Piece;
}(Piece));
var S_Piece = /** @class */ (function (_super) {
    __extends(S_Piece, _super);
    function S_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#00FF00";
        _this.segments[0].x = 0;
        _this.segments[0].y = 1;
        _this.segments[1].x = 1;
        _this.segments[1].y = 1;
        _this.segments[2].x = 1;
        _this.segments[2].y = 0;
        _this.segments[3].x = 2;
        _this.segments[3].y = 0;
        return _this;
    }
    return S_Piece;
}(Piece));
var Z_Piece = /** @class */ (function (_super) {
    __extends(Z_Piece, _super);
    function Z_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#FF0000";
        _this.segments[0].x = 0;
        _this.segments[0].y = 0;
        _this.segments[1].x = 1;
        _this.segments[1].y = 0;
        _this.segments[2].x = 1;
        _this.segments[2].y = 1;
        _this.segments[3].x = 2;
        _this.segments[3].y = 1;
        return _this;
    }
    return Z_Piece;
}(Piece));
var J_Piece = /** @class */ (function (_super) {
    __extends(J_Piece, _super);
    function J_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#0000FF";
        _this.segments[0].x = 0;
        _this.segments[0].y = 0;
        _this.segments[1].x = 0;
        _this.segments[1].y = 1;
        _this.segments[2].x = 1;
        _this.segments[2].y = 1;
        _this.segments[3].x = 2;
        _this.segments[3].y = 1;
        return _this;
    }
    return J_Piece;
}(Piece));
var L_Piece = /** @class */ (function (_super) {
    __extends(L_Piece, _super);
    function L_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#FFA500";
        _this.segments[0].x = 0;
        _this.segments[0].y = 1;
        _this.segments[1].x = 1;
        _this.segments[1].y = 1;
        _this.segments[2].x = 2;
        _this.segments[2].y = 1;
        _this.segments[3].x = 2;
        _this.segments[3].y = 0;
        return _this;
    }
    return L_Piece;
}(Piece));
//Logic objects
var RandomPieces = /** @class */ (function () {
    function RandomPieces() {
    }
    RandomPieces.prototype.peek = function (index) {
        return null;
    };
    RandomPieces.prototype.pop = function () {
        return null;
    };
    RandomPieces.prototype.piece_array = function () {
        var arr = new Array();
        arr.push(new O_Piece(0, 0));
        arr.push(new I_Piece(0, 0));
        arr.push(new T_Piece(0, 0));
        arr.push(new S_Piece(0, 0));
        arr.push(new Z_Piece(0, 0));
        arr.push(new J_Piece(0, 0));
        arr.push(new L_Piece(0, 0));
        return arr;
    };
    RandomPieces.prototype.ensure_available = function (index) {
    };
    return RandomPieces;
}());
var TrueRandom = /** @class */ (function (_super) {
    __extends(TrueRandom, _super);
    function TrueRandom() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.random_queue = new Array();
        return _this;
    }
    TrueRandom.prototype.peek = function (index) {
        this.ensure_available(index);
        return this.random_queue[index];
    };
    TrueRandom.prototype.pop = function () {
        this.ensure_available(0);
        return this.random_queue.pop();
    };
    TrueRandom.prototype.ensure_available = function (index) {
        while (this.random_queue.length - 1 < index) {
            var i = Math.floor(Math.random() * 7);
            var new_piece = null;
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
    };
    return TrueRandom;
}(RandomPieces));
var RandomBag = /** @class */ (function (_super) {
    __extends(RandomBag, _super);
    function RandomBag() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.bag_queue = new Array();
        return _this;
    }
    RandomBag.prototype.peek = function (index) {
        this.ensure_available(index);
        return this.bag_queue[index];
    };
    RandomBag.prototype.pop = function () {
        this.ensure_available(0);
        return this.bag_queue.pop();
    };
    RandomBag.prototype.ensure_available = function (index) {
        if (this.bag_queue.length - 1 < index) {
            var pieces = this.piece_array();
            shuffleArray(pieces);
            this.bag_queue = this.bag_queue.concat(pieces);
        }
    };
    return RandomBag;
}(RandomPieces));
function update() {
    var now = Date.now();
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
function slide() {
    var translate = 0;
    if (controller.left_down) {
        translate--;
    }
    else if (controller.right_down) {
        translate++;
    }
    if (translate !== 0) {
        for (var _i = 0, _a = current_piece.segments; _i < _a.length; _i++) {
            var segment = _a[_i];
            if (segment.x + current_piece.x + translate < 0 || segment.x + current_piece.x + translate >= BOARD_WIDTH) {
                console.log(segment.x);
                translate = 0;
                break;
            }
        }
        current_piece.x += translate;
    }
}
function rotate() {
}
function gravity() {
    if (current_piece) {
        IG += (delta_time / 16.66) * gravity_speed; //Updates_completed / updates_per_block == blocks_to_move
        var to_move = Math.floor(IG);
        if (to_move) {
            for (var _i = 0, _a = current_piece.segments; _i < _a.length; _i++) {
                var segment = _a[_i];
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
function render_dynamic_board() {
    if (current_piece) {
        board_ctx.clearRect(0, 0, board_ctx.canvas.width, board_ctx.canvas.height);
        current_piece.render(board_ctx);
    }
}
function draw_grid() {
    if (GRID_LINE_WIDTH === 0) {
        return;
    }
    grid_ctx.strokeStyle = "#000000";
    grid_ctx.lineWidth = GRID_LINE_WIDTH;
    var w = grid_ctx.canvas.width;
    var h = grid_ctx.canvas.height;
    grid_ctx.clearRect(0, 0, grid_ctx.canvas.width, grid_ctx.canvas.height);
    for (var x = (GRID_LINE_WIDTH / 2 | 0); x < w; x += RENDER_SCALE) {
        grid_ctx.moveTo(x, 0);
        grid_ctx.lineTo(x, h);
    }
    for (var y = (GRID_LINE_WIDTH / 2 | 0); y < h; y += RENDER_SCALE) {
        grid_ctx.moveTo(0, y);
        grid_ctx.lineTo(w, y);
    }
    grid_ctx.stroke();
}
function on_load() {
    piece_random = new RandomBag();
    IG = 0;
    controller = new Controller();
    controller_map = new ControllerMap();
    debug_text = document.getElementById("debug_text");
    board_background = document.getElementById("board_background");
    prepare_canvases();
    draw_grid();
    start_key_listener();
    start_render_thread();
}
function prepare_canvases() {
    var oldMoveTo = CanvasRenderingContext2D.prototype.moveTo; //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
    CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
        x |= 0;
        y |= 0;
        oldMoveTo.call(this, x, y);
    };
    var oldLineTo = CanvasRenderingContext2D.prototype.lineTo;
    CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
        x |= 0;
        y |= 0;
        oldLineTo.call(this, x, y);
    };
    var odd_offset = GRID_LINE_WIDTH % 2 ? 1 : 0;
    var w = (BOARD_WIDTH * RENDER_SCALE) + GRID_LINE_WIDTH;
    var h = (BOARD_HEIGHT * RENDER_SCALE) + GRID_LINE_WIDTH;
    var grid_obj = document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = w;
    grid_ctx.canvas.height = h;
    var board_obj = document.getElementById("board");
    board_ctx = board_obj.getContext("2d");
    board_ctx.canvas.width = w;
    board_ctx.canvas.height = h;
    if (odd_offset) {
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
        board_ctx.translate(0.5, 0.5);
    }
    board_background.style.width = "" + w;
    board_background.style.height = "" + h;
}
function start_key_listener() {
    document.addEventListener("keydown", function (event) {
        var code = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, true);
    });
    document.addEventListener("keyup", function (event) {
        var code = event.keyCode;
        if (event.shiftKey) {
            code = -2;
        }
        update_controller(code, false);
    });
}
function update_controller(keyCode, isDown) {
    if (keyCode === void 0) { keyCode = null; }
    if (isDown === void 0) { isDown = null; }
    if (keyCode) {
        var name_1 = controller_map.get_name_from_code(keyCode);
        if (isDown) {
            controller.press(name_1);
        }
        else if (isDown === false) {
            controller.release(name_1);
        }
        else {
            //TODO?
        }
    }
    else {
        controller.update();
        if (DEBUG_MODE) {
            var debug_str = "controller: " + JSON.stringify(controller, null, "\t") + "\r\n";
            debug_text.innerText += debug_str;
        }
    }
}
function start_render_thread() {
    start_time = Date.now();
    last_update_time = start_time;
    setInterval(update, 16.66);
}
//Per https://stackoverflow.com/a/12646864/4698411
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
window.onload = on_load;
//# sourceMappingURL=tetris_incremental.js.map