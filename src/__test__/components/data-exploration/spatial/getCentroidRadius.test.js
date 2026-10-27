import getCentroidRadius from 'components/data-exploration/spatial/getCentroidRadius';

// cells on a square grid with the given spacing
const gridPositions = (side, spacing) => {
  const positions = new Map();
  for (let i = 0; i < side; i += 1) {
    for (let j = 0; j < side; j += 1) {
      positions.set(i * side + j, [i * spacing, j * spacing]);
    }
  }
  return positions;
};

// Visium spots: rows offset by half a spot, spacing apart centre to centre
const hexPositions = (side, spacing) => {
  const positions = new Map();
  for (let row = 0; row < side; row += 1) {
    for (let col = 0; col < side; col += 1) {
      const x = (col + (row % 2) / 2) * spacing;
      const y = row * spacing * (Math.sqrt(3) / 2);
      positions.set(row * side + col, [x, y]);
    }
  }
  return positions;
};

// deterministic pseudo-random positions, like segmented cells
const irregularPositions = (n, extent) => {
  let seed = 1;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return new Map(Array.from({ length: n }, (_, i) => [i, [random() * extent, random() * extent]]));
};

describe('getCentroidRadius', () => {
  it('is half the spacing between neighbouring cells', () => {
    expect(getCentroidRadius(gridPositions(10, 4), 5)).toEqual(2);
    expect(getCentroidRadius(gridPositions(10, 30), 5)).toEqual(15);
  });

  it('scales with the cell spacing for large objects', () => {
    // 250k cells: sampled, still exact on a regular grid
    expect(getCentroidRadius(gridPositions(500, 2.5), 5)).toEqual(1.25);
  });

  it('draws Visium spots at their true size: 55um wide, 100um apart', () => {
    expect(getCentroidRadius(hexPositions(30, 100), 5)).toBeCloseTo(27.5);
    // in image pixels, e.g. 100um is 12 pixels
    expect(getCentroidRadius(hexPositions(30, 12), 5)).toBeCloseTo(3.3);
  });

  it('draws Visium spots at their true size when spots are missing', () => {
    // tissue-free / filtered spots leave gaps in the grid
    const positions = hexPositions(40, 100);
    Array.from(positions.keys()).filter((key) => key % 7 === 0)
      .forEach((key) => positions.delete(key));

    expect(getCentroidRadius(positions, 5)).toBeCloseTo(27.5);
  });

  it('keeps irregularly placed cells at half their spacing', () => {
    const positions = irregularPositions(5000, 1000);
    const radius = getCentroidRadius(positions, 5);

    // half the median nearest-neighbour distance (~0.5 / sqrt(density) for random points)
    expect(radius).toBeGreaterThan(2.5);
    expect(radius).toBeLessThan(5.5);
  });

  it('ignores cells at identical positions', () => {
    const positions = gridPositions(5, 10);
    positions.set('duplicate', [0, 0]);
    expect(getCentroidRadius(positions, 5)).toEqual(5);
  });

  it('falls back when the spacing cannot be estimated', () => {
    expect(getCentroidRadius(new Map(), 5)).toEqual(5);
    expect(getCentroidRadius(new Map([[0, [1, 1]]]), 5)).toEqual(5);
    expect(getCentroidRadius(new Map([[0, [1, 1]], [1, [1, 1]]]), 5)).toEqual(5);
  });
});
