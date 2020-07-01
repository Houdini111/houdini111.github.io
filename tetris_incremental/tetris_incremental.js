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
var DRAW_SCALE = 35;
var GRID_LINE_WIDTH = 2;
var grid_ctx;
var board_ctx;
var Segment = /** @class */ (function () {
    function Segment() {
    }
    return Segment;
}());
var Piece = /** @class */ (function () {
    function Piece(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
        this.segments = new Array();
        for (var i = 0; i < 4; i++) {
            this.segments.push(new Segment());
        }
    }
    return Piece;
}());
var O_Piece = /** @class */ (function (_super) {
    __extends(O_Piece, _super);
    function O_Piece(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.color = "#FFFF00";
        return _this;
    }
    return O_Piece;
}(Piece));
var start_time;
var last_render_time;
var current_piece;
var delta_time;
function render_dynamic_board() {
    var now = Date.now();
    delta_time = now - last_render_time;
    last_render_time = now;
    //let out: string = "RENDER. dt: " + delta_time;
    if (current_piece) {
        //out += " " + 2 * DRAW_SCALE;
        board_ctx.fillStyle = current_piece.color;
        board_ctx.fillRect(current_piece.x * DRAW_SCALE, current_piece.y * DRAW_SCALE, 2 * DRAW_SCALE, 2 * DRAW_SCALE);
    }
    //console.log(out);
}
function draw_grid() {
    grid_ctx.strokeStyle = "#000000";
    grid_ctx.lineWidth = GRID_LINE_WIDTH;
    //grid_ctx.globalAlpha = 1;
    var w = grid_ctx.canvas.width;
    var h = grid_ctx.canvas.height;
    grid_ctx.clearRect(0, 0, grid_ctx.canvas.width, grid_ctx.canvas.height);
    for (var x = (GRID_LINE_WIDTH / 2 | 0); x < w; x += DRAW_SCALE) {
        grid_ctx.moveTo(x, 0);
        grid_ctx.lineTo(x, h);
    }
    for (var y = (GRID_LINE_WIDTH / 2 | 0); y < h; y += DRAW_SCALE) {
        grid_ctx.moveTo(0, y);
        grid_ctx.lineTo(w, y);
    }
    grid_ctx.stroke();
}
function on_load() {
    prepare_canvases();
    draw_grid();
    start_keypress_listener();
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
    var grid_obj = document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = (BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH;
    grid_ctx.canvas.height = (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH;
    if (odd_offset) {
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
    }
    var board_obj = document.getElementById("board");
    board_ctx = board_obj.getContext("2d");
    board_ctx.canvas.width = (BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH;
    board_ctx.canvas.height = (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH;
    if (odd_offset) {
        board_ctx.translate(0.5, 0.5);
    }
}
function start_keypress_listener() {
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
function start_render_thread() {
    start_time = Date.now();
    last_render_time = start_time;
    setInterval(render_dynamic_board, 16.66);
}
window.onload = on_load;
//# sourceMappingURL=tetris_incremental.js.map