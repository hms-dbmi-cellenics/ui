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

describe('getCentroidRadius', () => {
  it('is half the spacing between neighbouring cells', () => {
    expect(getCentroidRadius(gridPositions(10, 4), 5)).toEqual(2);
    expect(getCentroidRadius(gridPositions(10, 30), 5)).toEqual(15);
  });

  it('scales with the cell spacing for large objects', () => {
    // 250k cells: sampled, still exact on a regular grid
    expect(getCentroidRadius(gridPositions(500, 2.5), 5)).toEqual(1.25);
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
