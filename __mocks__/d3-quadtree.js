// Mock for d3-quadtree
class Quadtree {
  constructor(data = [], x = (d) => d[0], y = (d) => d[1]) {
    this._x = x;
    this._y = y;
    this._data = data;
  }

  add(data) {
    if (Array.isArray(data)) {
      this._data.push(...data);
    } else {
      this._data.push(data);
    }
    return this;
  }

  visit(callback) {
    // Mock implementation
    return this;
  }

  find(x, y, radius) {
    // Return empty array for testing
    return [];
  }

  data() {
    return this._data;
  }
}

// Export a factory function that creates Quadtree instances
const quadtree = (data, x, y) => new Quadtree(data, x, y);

export { quadtree };
export default quadtree;
