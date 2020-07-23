class ColorProvider {
  constructor() {
    if (!ColorProvider.instance) {
      ColorProvider.instance = this;
    }
    this.colorPool = [
      '#082213', '#000036', '#8b008b', '#005051',
      '#B50000', '#551700', '#7023b7', '#2d383c',
      '#20603C', '#34515e', '#2a2400', '#634806',
      '#802200', '#34385e', '#005500', '#2a002a',
    ];
    this.nextColor = 0;
    return ColorProvider.instance;
  }

  getColor() {
    if (this.nextColor === this.colorPool.length) this.nextColor = 0;
    const color = this.colorPool[this.nextColor];
    this.nextColor += 1;
    return color;
  }
}

const instance = new ColorProvider();

export default instance;
