import Cell from './Cell.js'

export default class Bomb extends Cell {
  constructor(...args) {
    super(...args)

    this.value          = '💣';
    this.xPadding       = this.width / 7;
    this.yPadding       = this.height / 1.6;
  }

  reveal() {
    this.setColor(Cell.colorBomb);
    this.isRevealed = true;

    this.draw();
  }
}