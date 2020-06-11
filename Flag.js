import Cell from './Cell.js'

export default class Flag extends Cell {
  isDisplayed = false;
  static flagPicto = '🚩';
  static questionPicto = '❔';

  constructor(...args) {
    super(...args);

    this.value          = Flag.flagPicto;
    this.xPadding       = this.width / 6;
    this.yPadding       = this.height / 1.4;
  }

  reveal(content = this.value) {
    this.value = content;
    this.ctx.font=`${this.width / 1.5}px Arial`;
    this.draw();
    this.ctx.fillText(content, this.x + this.width / 6, this.y + this.height / 1.4);
  }
}