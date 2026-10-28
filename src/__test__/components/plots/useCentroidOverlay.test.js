import { act, renderHook } from '@testing-library/react';

import useCentroidOverlay from 'components/plots/useCentroidOverlay';

jest.useFakeTimers();

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

const renderOverlay = (params) => renderHook(() => useCentroidOverlay({
  enabled: true,
  embeddingData,
  colorMap,
  imageDims,
  opacity: 1,
  markerSize: 20,
  plotWidth: 500,
  plotHeight: 500,
  ...params,
}));

const render = (params) => renderOverlay(params).result.current.overlayData;

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

  it('fills a color with many cells in batches, which browsers can fill', () => {
    const manyCells = Array.from({ length: 25000 }, (_, i) => [i % 500, Math.floor(i / 500)]);
    const oneColor = new Map(manyCells.map((_, i) => [i, [255, 0, 0]]));

    render({ embeddingData: manyCells, colorMap: oneColor });

    expect(ctx.fill).toHaveBeenCalledTimes(3);
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

  describe('zoomed in', () => {
    const zoomTo = (result, xdom, ydom) => {
      act(() => result.current.onViewportChange(xdom, ydom));
    };

    it('draws the view sharper once zooming pauses, shown alone', () => {
      const { result } = renderOverlay();

      zoomTo(result, [0, 20], [80, 100]);
      // while zooming, only the whole slide image
      expect(result.current.overlayData).toHaveLength(1);

      act(() => jest.runAllTimers());

      const rows = result.current.overlayData;
      expect(rows).toHaveLength(1);
      // the view plus a quarter of it on each side, within the cells
      expect(rows[0]).toMatchObject({
        x1: -5, x2: 25, y1: 75, y2: 105,
      });
    });

    it('keeps the whole slide image under the sharp view while zooming again', () => {
      const { result } = renderOverlay();
      zoomTo(result, [0, 20], [80, 100]);
      act(() => jest.runAllTimers());

      zoomTo(result, [0, 40], [60, 100]);

      expect(result.current.overlayData).toHaveLength(2);
    });

    it('draws no detail image when the whole slide image is already as sharp', () => {
      // 1 screen pixel per unit, less than the whole slide image's 1.6
      const { result } = renderOverlay({ plotWidth: 100, plotHeight: 100 });
      const [baseRow] = result.current.overlayData;

      zoomTo(result, [-5, 95], [5, 105]);
      act(() => jest.runAllTimers());

      expect(result.current.overlayData).toEqual([baseRow]);
    });
  });
});
