import Board from './Board.js';

export default class Main {
  board = null;
  timerIsRunning = false;

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
    const timerElt      = document.querySelector('#game-timer');

    let gameOver        = false;
    let gameWin         = false;
    let timer           = 0;

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

    Object.defineProperty(this, 'timer', {
      set(newVal) {
        timerElt.innerText = newVal;
        timer = newVal;
      },
      get() {
        return timer
      }
    })
  }

  updateTimer() {
    this.timerIsRunning = true;
    setTimeout(() => {
      if (this.win || this.gameOver) return;
      this.updateTimer()
      this.timer++;
    }, 1000)
  }

  appendLeftBombsToDocument(bombs) {
    document.querySelector('#bombs').innerText = bombs;
  }

  lookForClickCandidate(e) {
    if (!this.timerIsRunning) this.updateTimer();
    if (this.gameOver || this.win) return;
    const x = e.x - e.target.offsetLeft + window.scrollX; // Remove potential margins
    const y = e.y - e.target.offsetTop + window.scrollY; // Remove potential margins
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