import Cell from './Cell.js';
import Button from './Button.js';
import Bomb from './Bomb.js';
import Flag from './Flag.js';

/**
 * @todo Adjuust mouse position if user has scrolled into view
 */
export default class Board {
  bombsPosition   = [];
  buttons         = [];
  canvas          = null;
  cells2D         = [];
  flags           = [];
  cellSize        = 60; // Size of cell in px
  cols            = 10;
  rows            = this.cols;
  ctx             = null;
  events          = {};
  gameOver        = false;
  lose            = false;
  totalCells      = this.cols * this.rows;
  totalBombs      = Math.ceil(this.totalCells / 10);
  background      = 'grey';
  cells2DCoords    = [];

  constructor(cellSize, cols, rows, totalBombs) {
    
    this.cellSize   = cellSize ? cellSize : this.cellSize;
    this.cols = cols ? cols : this.cols;
    this.rows = rows ? rows : this.rows;
    this.totalBombs = totalBombs ? totalBombs : this.totalBombs;

    this.canvas     = document.querySelector('#gameBoard');
    this.ctx        = this.canvas.getContext('2d');

    this.updateCanvasSize2D();
    this.drawBackground();
    this.defCustomProperties();
    this.fillCells2D();
    this.addBombsInCells2D();
    this.check2D();
    this.drawCells2D();
  }

  /**
   * Update canvas size depending on total numbers of Cells and their size
   * /!\ You can't change canvas size with CSS !
   */
  updateCanvasSize2D() {
    const width = this.cols * this.cellSize;
    const height = this.rows * this.cellSize;

    this.canvas.setAttribute('width', width);
    this.canvas.setAttribute('height', height);
  }

  /**
   * Add color in background. Has to be called after updateCanvasSize but before
   * any other draw
   */
  drawBackground() {
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * For '<Array>flags' alter default push and splice methods to allow some actions
   * on each calls. You can view it like tiny Observers
   */
  defCustomProperties() {
    let bombsLeft = this.totalBombs;
    Object.defineProperty(this, 'bombsLeft', {
      set(newVal) {
        this.emit('flags:updated', newVal);
        bombsLeft = newVal
      },
      get() {
        return bombsLeft
      }
    });
  }

  /**
   * Fill '<Array>cells2D' with Cell Objects. 
   * '<Array>Buttons' will be filled too, sharing the same size / coordinates than Cell objects.
   */
  fillCells2D() {
    const cols = new Array(this.cols);
    const rows = new Array(this.rows);

    for(let i = 0; i < cols.length; i++) {
      this.cells2D[i] = !this.cells2D[i] ? this.cells2D[i] = [] : this.cells2D[i];
      for(let j = 0; j < rows.length; j++) {
        const x               = i * this.cellSize;
        const y               = j * this.cellSize;
        const cell            = new Cell(this.canvas, x, y, this.cellSize, this.cellSize, 0);
        const onMouseEvent    = (e) => {this.onMouseEvent2D(e, {col: i, row: j})};
        const button          = new Button(x, y, this.cellSize, this.cellSize, onMouseEvent);
        this.cells2D[i][j]    = cell;
        this.cells2DCoords.push([i, j]);
        this.buttons.push(button);
      }
    }
  }

  /**
   * Increment vvalue of each Cell wich is a Bomb's sibling
   */
  check2D() {
    let col = 0, row = 0;
    for(let i = 0; i < this.cells2D.length; i++) {
      for(let j = 0; j < this.cells2D[i].length; j++) {
        if (this.cells2D[i][j] instanceof Bomb) {
          continue
        }
        for(let xOffset = -1; xOffset <= 1; xOffset++) {
          col = i + xOffset;
          if (col < 0 || col >= this.cells2D.length) {continue};

          for(let yOffset = -1; yOffset <= 1; yOffset++) {
            row = j + yOffset;
            if (row < 0 || row >= this.cells2D[i].length) {continue};

            if (this.cells2D[col][row] instanceof Bomb) {
              this.cells2D[i][j].value++
            }
          }
        }
      }
    }
  }

  /**
   * Randomly add Bomb objects in '<Array>cells'
   * The '<Array>bombIndexes' will be fill to keep track of Bombs indexes
   */
  addBombsInCells2D() {
    let total = this.totalBombs;
    console.log(total)
    while (total > 0) {
      const randIndex = parseInt(Math.random() * (this.totalCells))
      
      const cellCoords                        = this.cells2DCoords[randIndex];
      const col                               = cellCoords[0];
      const row                               = cellCoords[1];

      if (this.cells2D[col][row] instanceof Bomb) continue;

        const {canvas,x,y,width,height}         = this.cells2D[col][row];
        this.cells2D[col][row]                  = new Bomb(canvas, x, y, width, height, undefined);
      
        this.bombsPosition.push([col, row])
      total--;
    }
  }
  
  /**
   * Draw all Cell objects in their init state (grey with no value)
   */
  drawCells2D() {
    for(let i = 0; i < this.cols; i++) {
      for(let j = 0; j < this.rows; j++) {
        this.cells2D[i][j].draw();
      }
    }
  }

  /**
   * Handle mouse events ('click' and 'contextmenu') triggered on Button objects.
   * 
   * /!\ Keep in mind that the actual HTML eventListeners are set in Main.js, 
   * and then are dispatched here.
   * 
   * @param {MouseEvent} event 
   * @param {number[]} position Current Cell position (position in <Array>cells2D)
   */
  onMouseEvent2D(event, position) {
    if (event.type === 'click') this.onClick2D(event, position);
    else this.onContextMenu2D(event, position);
  }

  /**
   * Handle the 'click' event. 
   * It will:
   * - End game (game over) if user clicked on Bomb
   * - Clear any siblings which fulfill the conditions
   * - Reveal Cell which has been clicked on
   * - End game (win) if user revealed all non-Bomb Cells
   * 
   * @param {MouseEvent} event 
   * @param {number} position Current Cell position (position in <Array>cells2D)
   */
  onClick2D(event, position) {
    const cell = this.cells2D[position.col][position.row];
    if (cell instanceof Flag) return;
    
    if (cell instanceof Bomb) this.handleLose();
    if (cell instanceof Cell && cell.value === 0 ) this.clearEmptyCells2D(position);
    cell.reveal();
    this.handleWin();
  }

  /**
   * This will reveal() any Cell wich has a value of 0, or whose direct siblings
   * are not Bombs
   * 
   * @param {number[]} position 
   */
  clearEmptyCells2D(position) {
    setTimeout(() => {
      let col = 0, row = 0;
      const i = position.col;
      const j = position.row;
      if (this.cells2D[i][j] instanceof Bomb) {
        return;
      }
        
      for(let xOffset = -1; xOffset <= 1; xOffset++) {
        col = i + xOffset;
        if (col < 0 || col >= this.cells2D.length) {continue};

        for(let yOffset = -1; yOffset <= 1; yOffset++) {
          row = j + yOffset;
          if (row < 0 || row >= this.cells2D[i].length) {continue};

          if (!this.cells2D[col][row].isRevealed) {
            this.cells2D[col][row].reveal();
            this.handleWin();
            if (this.cells2D[col][row].value === 0) {
              this.clearEmptyCells2D({col, row});
            }
          }
        }
      }
    }, 16)
  }

  /**
   * Handle 'contextmenu' event (right click).
   * It will:
   * - Save original Cell in 'flags' collection
   * - Replace Cell by Flag object in 'cells' collection
   * - Draw a 'flag' picto
   * - Draw a 'question-mark' picto if 'flag' picto was already drawn
   * - Put back Cell object if 'question-mark' was drawn
   * 
   * @param {MouseEvent} event 
   * @param {number[]} position Current Cell position (position in <Array>cells2D)
   */
  onContextMenu2D(event, position) {
    event.preventDefault();
    const cell = this.cells2D[position.col][position.row];
    
    if (!(cell instanceof Flag) && !cell.isRevealed) {
      this.bombsLeft--;
      this.replaceCellByFlag2D(position)
    }
    else if (cell.value === Flag.flagPicto) cell.reveal(Flag.questionPicto);
    else if (cell.value === Flag.questionPicto) {
      this.bombsLeft++;
      this.replaceFlagByCell(position)
    };
  }

  /**
   * Remove Cell from 'cells' collection via its position and place it into
   * 'flags' collection. 
   * Then add a new Flag object at the position of the previous Cell.
   * 
   * @param {number} position Current Cell position (position in <Array>cells2D)
   */
  replaceCellByFlag2D(position) {
    const cell                        = this.cells2D[position.col][position.row];
    const {canvas,x,y,width,height}   = cell;
    const flag                        = new Flag(canvas,x,y,width,height);

    if(!this.flags[position.col]) this.flags[position.col] = [];

    this.flags[position.col][position.row] = cell;
    this.cells2D[position.col][position.row] = flag;

    flag.reveal(Flag.flagPicto);
  }

  /**
   * Get back the saved Cell from 'flags' collection via its index. 
   * Then remove Flag object from 'cells' collection and place the Cell instead.
   * 
   * @param {number[]} position Current Flag position (position in <Array>cells2D)
   */
  replaceFlagByCell(position) {
    const cell           = this.flags[position.col][position.row];
    this.cells2D[position.col][position.row] = cell;
    delete this.flags[position.col][position.row]
    cell.reset();
  }

  /**
   * Check if game is won and emit an event if it is
   */
  handleWin() {
    if (Cell.totalRevealed === this.totalCells -  this.totalBombs) {
      this.emit('game:win')
    }
  }

  /**
   * Check if game is lost and emit an event if it is, 
   * then reveal all bombs in board (including flagged ones)
   */
  handleLose() {
    this.lose = true;
    this.gameOver = true;
    this.emit('game:gameover');
    this.revealAllBombs();
  }

  /**
   * Reveal all Bombs on the Board.
   * Including flagged ones
   */
  revealAllBombs() {    
    for(let i = 0, len = this.bombsPosition.length; i < len; i++) {
      const bombPosition = this.bombsPosition[i];
      const col = bombPosition[0];
      const row = bombPosition[1];
      const cell = this.cells2D[col][row];
      if (cell) cell.reveal();
    }
    this.revealFlaggedBombs()
  }

  /**
   * Reveal all Bombs which were having a Flag. 
   * The 'flags' collection is browsed to do it.
   */
  revealFlaggedBombs() {
    for(let i = 0, len = this.flags.length; i < len; i++) {
      if (!this.flags[i]) return;

      for(let j = 0, len = this.flags[i].length; j < len; j++) {
        const cell = this.flags[i][j];
        if (cell instanceof Bomb) cell.reveal()
      }

    }
  }

  /**
   * Tiny system of event emitter / receiver. 
   * The 'on()' method give possibility to execute a callback when 'emit()'
   * is called with the same event name.
   * 
   * @param {string} eventName 
   * @param {Function} callback 
   */
  on(eventName, callback) {
    if(!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * Tiny system of event emitter / receiver. 
   * The 'emit()' method give possibility to execute a callback when 'on()' was previously
   * called with the same event name and a callback.
   * 
   * @param {string} eventName 
   * @param {Function} callback 
   */
  emit(eventName, options) {
    // do not execute undefined event
    if(!this.events[eventName]) return;

    for(let i = 0, len = this.events[eventName].length; i < len; i++) {
      const eventCallback = this.events[eventName][i];
      eventCallback(options);
    }
  }
}
