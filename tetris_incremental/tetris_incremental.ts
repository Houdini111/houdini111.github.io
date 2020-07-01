const BOARD_WIDTH: number = 10;
const BOARD_HEIGHT: number = 20; 
const DRAW_SCALE: number = 40;
const GRID_LINE_WIDTH: number = 4;

let grid_ctx: CanvasRenderingContext2D;
let board_ctx: CanvasRenderingContext2D;

let RenderableEntity = function () {
    let x: number = 0;
    let y: number = 0;
    let image: object = null;

    this.render = function (context: any) {
        context.drawImage(this.image, this.x, this.y);
    }
}

function render(context: any): void {
    //context.clearRect(0, 0, width, height);
    //background.render(context);
}

function draw_grid(): void {
    grid_ctx.strokeStyle = "#000000";
    grid_ctx.lineWidth = GRID_LINE_WIDTH;
    //grid_ctx.globalAlpha = 1;

    for (let x: number = GRID_LINE_WIDTH / 2 | 0; x < (BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH; x += DRAW_SCALE) {
        grid_ctx.moveTo(x, 0);
        grid_ctx.lineTo(x, (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH);
    }
    for (let y: number = GRID_LINE_WIDTH/2|0; y < (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH; y += DRAW_SCALE) {
        grid_ctx.moveTo(0, y);
        grid_ctx.lineTo((BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH, y);
    }
    grid_ctx.stroke();
}

function on_load(): void {
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

    let even_offset = GRID_LINE_WIDTH % 2 ? 0 : 1;

    let grid_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board_grid");
    grid_ctx = grid_obj.getContext("2d");
    grid_ctx.canvas.width = (BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH + even_offset;
    grid_ctx.canvas.height = (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH + even_offset;
    if (GRID_LINE_WIDTH % 2 !== 0) { 
        grid_ctx.translate(0.5, 0.5); //For sharpening, see: https://stackoverflow.com/a/23613785/4698411
    }

    let board_obj: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("board");
    board_ctx = board_obj.getContext("2d");
    board_ctx.canvas.width = (BOARD_WIDTH * DRAW_SCALE) + GRID_LINE_WIDTH + even_offset;
    board_ctx.canvas.height = (BOARD_HEIGHT * DRAW_SCALE) + GRID_LINE_WIDTH + even_offset;
    if (GRID_LINE_WIDTH % 2 !== 0) {
        board_ctx.translate(0.5, 0.5);
    }

    draw_grid();


}

window.onload = on_load;