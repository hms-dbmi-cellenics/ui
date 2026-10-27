import { renderHook } from '@testing-library/react';

import useCentroidOverlay from 'components/plots/useCentroidOverlay';

const ctx = {
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  rect: jest.fn(),
  moveTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
};
HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx);

// a 10 x 10 square grid of cells, 10 units apart, half red and half blue
const embeddingData = Array.from(
  { length: 100 }, (_, i) => [(i % 10) * 10, Math.floor(i / 10) * 10],
);
const colorMap = new Map(embeddingData.map((_, i) => [i, i < 50 ? [255, 0, 0] : [0, 0, 255]]));
const imageDims = { imageWidth: 100, imageHeight: 100 };

const render = (params) => renderHook(() => useCentroidOverlay({
  enabled: true, embeddingData, colorMap, imageDims, opacity: 1, markerSize: 20, ...params,
})).result.current;

describe('useCentroidOverlay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('draws cells into one image covering them, in the y-up plot space', () => {
    const rows = render();

    expect(rows).toHaveLength(1);
    // cells reach half the spacing (5 units) past the outermost centroids
    expect(rows[0]).toMatchObject({
      x1: -5, x2: 95, y1: 5, y2: 105,
    });
    expect(rows[0].url).toMatch(/^seg-overlay:\/\//);
  });

  it('draws each color in one fill, with each cell as a round dot', () => {
    render();

    expect(ctx.fill).toHaveBeenCalledTimes(2);
    expect(ctx.arc).toHaveBeenCalledTimes(100);
  });

  it('scales the dot area with marker size', () => {
    const rows = render({ markerSize: 80 });

    // radius doubles to 10 units
    expect(rows[0]).toMatchObject({ x1: -10, x2: 100 });
  });

  it('draws nothing when segmentations are shown instead', () => {
    expect(render({ enabled: false })).toBeNull();
    expect(ctx.fill).not.toHaveBeenCalled();
  });
});
