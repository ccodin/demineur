import Cell from './Cell.js';
import Button from './Button.js';
import Bomb from './Bomb.js';
import Flag from './Flag.js';

/**
 * @todo Adjuust mouse position if user has scrolled into view
 */
export default class Board {
  bombsIndexes    = [];
  buttons         = [];
  canvas          = null;
  cells           = [];
  flags           = [];
  cellSize        = 28; // Size of cell in px
  cellsByRow      = 10;
  cellsByCol      = this.cellsByRow;
  ctx             = null;
  events          = {};
  gameOver        = false;
  lose            = false;
  margin          = Math.round(this.cellSize / 6);
  queue           = [];
  totalCells      = this.cellsByRow * this.cellsByRow;
  totalBombs      = Math.ceil(this.totalCells / 7);
  background      = 'grey';

  constructor(cellSize, cellsByRow, cellsByCol, totalBombs) {
    this.cellSize   = cellSize ? cellSize : this.cellSize;
    this.cellsByRow = cellsByRow ? cellsByRow : this.cellsByRow;
    this.cellsByCol = cellsByCol ? cellsByCol : this.cellsByCol;
    this.totalBombs = totalBombs ? totalBombs : this.totalBombs;

    this.canvas     = document.querySelector('#gameBoard');
    this.ctx        = this.canvas.getContext('2d');

    this.updateCanvasSize();
    this.drawBackground();
    this.defCustomProperties();
    this.fillCells();
    this.addBombsInCells();
    this.addHintsValuesInCells();
    this.draw();
  }

  /**
   * Update canvas size depending on total numbers of Cells and their size
   * /!\ You can't change canvas size with CSS !
   */
  updateCanvasSize() {
    const width = this.margin + this.cellsByRow * (this.cellSize + this.margin);
    const height = this.margin + this.cellsByCol * (this.cellSize + this.margin);

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
    const that = this;

    Object.defineProperty(this.flags, 'push', {
      value: function mutator(args) {
        const totalFlags = Array.prototype.push.call(this, args);
        that.emit('flags:updated', that.totalBombs - totalFlags);
        return totalFlags;
      }
    });

    Object.defineProperty(this.flags, 'splice', {
      value: function mutator(...args) {
        const totalFlags = Array.prototype.splice.call(this, ...args);
        that.emit('flags:updated', that.totalBombs - that.flags.length);
        return totalFlags;
      }
    });
  }

  /**
   * Fill '<Array>cells' with Cell Objects. 
   * '<Array>Buttons' will be filled too, sharing the same size / coordinates than Cell objects.
   */
  fillCells() {
    this.cells = new Array(this.totalCells);

    for (let i = 0; i < this.cells.length; i++) {
      const x               = this.margin + (i % this.cellsByRow) * (this.cellSize + this.margin);
      const y               = this.margin + Math.floor(i / this.cellsByRow) * (this.cellSize + this.margin);
      
      const cell            = new Cell(this.canvas, x, y, this.cellSize, this.cellSize, 0);
      const onMouseEvent    = (e) => {this.onMouseEvent(e, cell, i)};
      const button          = new Button(x, y, this.cellSize, this.cellSize, onMouseEvent);

      this.cells[i]         = cell;
      this.buttons[i]       = button;
    }
  }

  /**
   * Randomly add Bomb objects in '<Array>cells'
   * The '<Array>bombIndexes' will be fill to keep track of Bombs indexes
   */
  addBombsInCells() {
    let total = this.totalBombs;
    while (total > 0) {
      const randIndex = parseInt(Math.random() * (this.totalCells))
      
      if (this.cells[randIndex] instanceof Bomb) continue;
      
      const {canvas,x,y,width,height}   = this.cells[randIndex];
      const onMouseEvent                = (e) => {this.onMouseEvent(e, this.cells[randIndex], randIndex)};
      this.cells[randIndex]             = new Bomb(canvas, x, y, width, height, undefined);
      const button                      = new Button(x, y, this.cellSize, this.cellSize, onMouseEvent);
      this.buttons[randIndex]           = button;
      
      this.bombsIndexes.push(randIndex);
      total--;
    }
  }

  /**
   * Add number hints around Bomb objects. 
   * It calls check() methods, wich is a recursive method, on the very first Bomb
   */
  addHintsValuesInCells() {
    this.check(this.cells, this.bombsIndexes[0]);
  }

  /**
   * For each Bomb object, it will increment its siblings Cells
   * 
   * @param {Cell[]} cells 
   * @param {number} index Current Cell index (position in <Array>cells)
   */
  check(cells, index) {
    const cell = cells[index];

    if (cell instanceof Bomb) {
      const actionOnEachCell = (surroundingCells) => {
        surroundingCells.map(((surroundingCellIndex) => {
          const cell = this.cells[surroundingCellIndex];
          if (!(cell instanceof Bomb) && cell !== undefined) {
            cell.value += 1;
          }
        }))
        const i = this.bombsIndexes.indexOf(index);
        if (this.bombsIndexes[i + 1] !== undefined) {
          this.check(this.cells, this.bombsIndexes[i + 1])
        }
      }

      this.mapOnSurroundingCells(index, actionOnEachCell);
    }
  }

  /**
   * Get all Bomb siblings (max: 8) and pass them into a callback.
   * 
   * @todo Use graph of nodes to improve perf
   * @param {number} index Current Bomb index (position in <Array>cells)
   * @param {Function} callback 
   */
  mapOnSurroundingCells(index, callback) {
    const isOnTop = Math.floor(index / this.cellsByRow) === 0;
    const isOnBottom = index + this.cellsByRow > this.cells.length - 1;
    const isOnLeft = index % this.cellsByRow === 0;
    const isOnRight = (index + 1) % this.cellsByRow === 0;

    const leftCellIndex         = isOnLeft ? undefined : index - 1;
    const topCellIndex          = isOnTop ? undefined : index - this.cellsByRow;
    const rightCellIndex        = isOnRight ? undefined : index + 1;
    const bottomCellIndex       = isOnBottom ? undefined : index + this.cellsByRow;
    const leftTopCellIndex      = isOnLeft || isOnTop ? undefined : index - this.cellsByRow - 1;
    const rightTopCellIndex     = isOnRight || isOnTop ? undefined : index - this.cellsByRow + 1;
    const leftBottomCellIndex   = isOnLeft || isOnBottom ? undefined : index + this.cellsByRow - 1;
    const rightBottomCellIndex  = isOnRight || isOnBottom ? undefined : index + this.cellsByRow + 1;      

    const surroundings = [
      leftCellIndex, 
      topCellIndex, 
      rightCellIndex, 
      bottomCellIndex,
      leftTopCellIndex,
      rightTopCellIndex,
      leftBottomCellIndex,
      rightBottomCellIndex
    ];

    callback(surroundings);
  }

  /**
   * Draw all Cell objects in their init state (grey with no value)
   */
  draw() {
    for (let i = 0, len = this.cells.length; i < len; i++) {
      this.cells[i].draw();
    }
  }

  /**
   * Handle mouse events ('click' and 'contextmenu') triggered on Button objects.
   * 
   * /!\ Keep in mind that the actual HTML eventListeners are set in Main.js, 
   * and then are dispatched here.
   * 
   * @param {MouseEvent} event 
   * @param {Cell} cell 
   * @param {number} index Current Cell index (position in <Array>cells)
   */
  onMouseEvent(event, cell, index) {
    if (event.type === 'click') this.onClick(event, cell, index);
    else this.onContextMenu(event, cell, index);
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
   * @param {Cell} cell 
   * @param {number} index Current Cell index (position in <Array>cells)
   */
  onClick(event, cell, index) {
    if (this.cells[index] instanceof Flag) return;
    
    if (cell instanceof Bomb) this.handleLose();
    if (cell instanceof Cell && cell.value === 0 ) this.clearEmptyCells(this.cells, index);
    
    cell.reveal();
    this.handleWin();
  }

  /**
   * This will reveal() any Cell wich has a value of 0, or whose direct siblings
   * are not Bombs
   * 
   * @param {Cell[]} cells 
   * @param {number} index 
   */
  clearEmptyCells(cells, index) {
    setTimeout(() => {
      const cell = cells[index];
      if (!(cell instanceof Bomb)) {
        const actionOnEachCell = (surroundingCells) => {
          surroundingCells.map(((surroundingCellIndex, index) => {
            if (surroundingCellIndex === undefined) return;

            const cell = this.cells[surroundingCellIndex];

            if ((this.cells[surroundingCellIndex].value === 0) && this.queue.indexOf(surroundingCellIndex) < 0) {
              this.queue.push(surroundingCellIndex);
              this.clearEmptyCells(this.cells, surroundingCellIndex)
            }
            if (!cell.isRevealed) cell.reveal();            
          }))
        }
        this.mapOnSurroundingCells(index, actionOnEachCell)
      }
      this.handleWin();
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
   * @param {Cell} cell 
   * @param {number} index Current Cell index (position in <Array>cells)
   */
  onContextMenu(event, scell, index) {
    event.preventDefault();
    const cell = this.cells[index];
    
    if (!(cell instanceof Flag) && !cell.isRevealed) this.replaceCellByFlag(index);
    else if (cell.value === Flag.flagPicto) cell.reveal(Flag.questionPicto);
    else if (cell.value === Flag.questionPicto) this.replaceFlagByCell(index);
  }

  /**
   * Remove Cell from 'cells' collection via its index and place it into
   * 'flags' collection. 
   * Then add a new Flag object at the index of the previous Cell.
   * 
   * @param {number} index Current Cell index (position in <Array>cells)
   */
  replaceCellByFlag(index) {
    const cell                        = this.cells[index];
    const {canvas,x,y,width,height}   = cell;
    const flag                        = new Flag(canvas,x,y,width,height);

    this.flags.push({cell, flag, index});
    this.cells.splice(index, 1, flag);

    flag.reveal(Flag.flagPicto);
  }

  /**
   * Get back the saved Cell from 'flags' collection via its index. 
   * Then remove Flag object from 'cells' collection and place the Cell instead.
   * 
   * @param {number} index Current Flag index (position in <Array>cells)
   */
  replaceFlagByCell(index) {
    const flagIndex      = this.flags.findIndex((flag) => flag.flag === this.cells[index]);
    const cell           = this.flags[flagIndex].cell;
    
    this.cells.splice(index, 1, cell)
    this.flags.splice(flagIndex, 1)
    cell.reset();
  }

  /**
   * Check if game is won and emit an event if it is
   */
  handleWin() {
    if (Cell.totalRevealed === this.cells.length - this.totalBombs) {
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
    for(let i = 0, len = this.bombsIndexes.length; i < len; i++) {
      const bombIndex = this.bombsIndexes[i];
      const cell = this.cells[bombIndex];
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
      const cell = this.flags[i].cell;

      if (cell instanceof Bomb) cell.reveal()
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
