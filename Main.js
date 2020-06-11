import Board from './Board.js';

export default class Main {
  board = null;

  constructor() {
    this.defCustomProperties();
  }

  init() {
    this.gameOver = false;
    this.board = new Board();

    this.setListeners();
    this.appendLeftBombsToDocument(this.board.totalBombs);
    
  }

  setListeners() {
    this.board.canvas.addEventListener('click', this.lookForClickCandidate.bind(this));
    this.board.canvas.addEventListener('contextmenu', this.lookForClickCandidate.bind(this));
    this.board.on('game:gameover', () => {this.gameOver = true;})
    this.board.on('game:win', () => {this.win = true;})
    this.board.on('flags:updated', this.appendLeftBombsToDocument)
  }

  defCustomProperties() {
    const gameOverElt   = document.querySelector('#game-over');
    const gameWinElt    = document.querySelector('#game-win');

    let gameOver        = false;
    let gameWin         = false;

    Object.defineProperty(this, 'gameOver', {
      set(newVal) {
        if (newVal) gameOverElt.classList.remove('hide');
        else gameOverElt.classList.add('hide');
        gameOver = newVal
      },
      get() {
        return gameOver
      }
    })

    Object.defineProperty(this, 'win', {
      set(newVal) {
        if (newVal) gameWinElt.classList.remove('hide');
        else gameWinElt.classList.add('hide');
        gameWin = newVal
      },
      get() {
        return gameWin
      }
    })
  }

  appendLeftBombsToDocument(bombs) {
    document.querySelector('#bombs').innerText = bombs;
  }

  lookForClickCandidate(e) {
    if (this.gameOver || this.win) return;
    const x = e.x - e.target.offsetLeft; // Remove potential margins
    const y = e.y - e.target.offsetTop; // Remove potential margins
    const mouse = {x, y};

    const buttons = this.board.buttons;

    for(let i = 0, len = buttons.length; i < len; i++) {
      const button = buttons[i];
      const isInHorizontalRange = button.x <= mouse.x && button.x + button.width >= mouse.x;
      const isInVerticalRange = button.y <= mouse.y && button.y + button.height >= mouse.y;
      
      if (isInHorizontalRange && isInVerticalRange) {
        button.handler(e, button)
        return button;
      }
    }
  }
}