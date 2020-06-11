export default class Button {
  static POOL = [];

  x = 0;
  y = 0;
  width = 0;
  height = 0;
  handler = null;
  isClicked = false;

  constructor(x, y, width, height, handler) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.handler = (...args) => {
      this.isClicked = true;
      handler(...args)
    };

    this.addButtonToPool();
  }

  addButtonToPool() {
    Button.POOL.push(this)
  }

  static removeButtonFromPool(button) {
    const buttonTonRemove = Button.POOL.findIndex((currentButton) => currentButton === button);
    Button.POOL.splice(buttonTonRemove, 1);
  }
}