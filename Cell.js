export default class Cell {
  static colorEmpty       = '#eaeaea';
  static colorDefault     = '#c1c1c1';
  static colorBomb        = '#ff2d2d';
  static textColorDefault = '#fff';

  canvas        = null;
  x             = null; 
  y             = null;
  width         = null;
  height        = null;
  color         = Cell.colorDefault;
  textColor     = Cell.textColorDefault;
  value         = null;
  debug         = false;
  isRevealed    = false;
  xPadding      = null;  
  yPadding      = null;
  
  static totalRevealed = 0;

  constructor(
      canvas, 
      x, 
      y, 
      width, 
      height, 
      value = 0, 
      color = Cell.colorDefault
    ) {
    
    this.x              = x;
    this.y              = y;
    this.width          = width;
    this.height         = height;
    this.value          = value;
    this.color          = color;
    this.canvas         = canvas;
    this.ctx            = this.canvas.getContext('2d');
    this.xPadding       = this.width / 2.4;
    this.yPadding       = this.height / 1.4;
  }

  draw() {
    this.ctx.fillStyle  = this.color;
    this.ctx.clearRect(this.x, this.y, this.width, this.height);
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    if ((this.isRevealed && this.value !== 0) || this.debug) {
        this.ctx.font = `bold ${this.width / 1.5}px Arial`;
        this.ctx.fillStyle  = this.textColor;
        this.ctx.fillText(this.value, this.x + this.xPadding, this.y + this.yPadding);
      }
  }

  reveal() {
    if (this.isRevealed) console.log('already revealed')
    if (this.isRevealed) return;

    this.setColor(Cell.colorEmpty);
    this.isRevealed = true;
    Cell.totalRevealed++;
    
    if (this.value !== 0) {
      const red     = (this.value / 8) * 255;
      const green   = (1 / this.value) * 200;
      const blue    = 50;

      let textColor = `rgba(${red},${green},${blue})`;
      
      this.setTextColor(textColor);
    }

    this.draw();
  }

  reset() {
    this.setColor(Cell.colorDefault);
    this.draw();
  }

  setColor(newColor) {
    this.color = newColor;
  }

  setTextColor(newColor) {
    this.textColor = newColor;
  }


}