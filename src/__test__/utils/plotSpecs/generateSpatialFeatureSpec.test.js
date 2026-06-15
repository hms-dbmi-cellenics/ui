import _ from 'lodash';

import {
  generateSpec, generateData, filterCells,
} from 'utils/plotSpecs/generateSpatialFeatureSpec';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { plotTypes } from 'utils/constants';
import {
  createHierarchyFromTree,
  createPropertiesFromTree,
} from 'redux/reducers/cellSets/helpers';

const { cellSets: mockCellSets } = require('__test__/data/cell_sets.json');

const baseConfig = () => _.cloneDeep(initialPlotConfigStates[plotTypes.SPATIAL_FEATURE]);
const imageData = { imageWidth: 1000, imageHeight: 500 };

describe('generateSpatialFeatureSpec', () => {
  describe('marks', () => {
    it('renders the tissue image mark only when showImage is true', () => {
      const withImage = generateSpec({ ...baseConfig(), showImage: true }, 'mock', imageData, []);
      const withoutImage = generateSpec({ ...baseConfig(), showImage: false }, 'mock', imageData, []);

      const tissueMark = (spec) => spec.marks.find(
        (m) => m.type === 'image' && m.from.data === 'tissueImageData',
      );
      expect(tissueMark(withImage)).toBeDefined();
      expect(tissueMark(withoutImage)).toBeUndefined();
    });

    it('renders the data-driven segmentation overlay mark when hasSegmentation is true', () => {
      const spec = generateSpec(baseConfig(), 'mock', imageData, [], true);
      const segMark = spec.marks.find(
        (m) => m.type === 'image' && m.from.data === 'segOverlayData',
      );
      const dotMark = spec.marks.find((m) => m.type === 'symbol');

      expect(segMark).toBeDefined();
      // overlay replaces the centroid-dot fallback
      expect(dotMark).toBeUndefined();
    });

    it('falls back to centroid dots when there is no segmentation', () => {
      const spec = generateSpec(baseConfig(), 'mock', imageData, [], false);
      const segMark = spec.marks.find(
        (m) => m.type === 'image' && m.from.data === 'segOverlayData',
      );
      const dotMark = spec.marks.find((m) => m.type === 'symbol');

      expect(segMark).toBeUndefined();
      expect(dotMark).toBeDefined();
      expect(dotMark.from.data).toBe('plotData');
    });
  });

  describe('colour scale: spectral-reverse XOR reverseCbar', () => {
    const reverseFlag = (config) => generateSpec(config, 'mock', imageData, [])
      .scales.find(({ name }) => name === 'color').reverse;

    it('spectral gradient defaults to reversed (no explicit reverseCbar)', () => {
      const config = baseConfig();
      config.colour = { ...config.colour, gradient: 'spectral', reverseCbar: false };
      expect(reverseFlag(config)).toBe(true);
    });

    it('spectral + reverseCbar cancels out to NOT reversed (XOR)', () => {
      const config = baseConfig();
      config.colour = { ...config.colour, gradient: 'spectral', reverseCbar: true };
      expect(reverseFlag(config)).toBe(false);
    });

    it('non-spectral gradient is not reversed by default', () => {
      const config = baseConfig();
      config.colour = { ...config.colour, gradient: 'default', reverseCbar: false };
      expect(reverseFlag(config)).toBe(false);
    });

    it('non-spectral gradient + reverseCbar is reversed', () => {
      const config = baseConfig();
      config.colour = { ...config.colour, gradient: 'default', reverseCbar: true };
      expect(reverseFlag(config)).toBe(true);
    });
  });

  describe('mini-plot aspect-fit dimensions', () => {
    it('fits a wide (landscape) slide within the square box, keeping aspect', () => {
      const config = { ...baseConfig(), miniPlot: true };
      config.dimensions = { ...config.dimensions, width: 92, height: 92 };
      // 1000x500 → aspect 2 (>= 1): width = box(92), height = box/aspect = 46
      const spec = generateSpec(config, 'mock', { imageWidth: 1000, imageHeight: 500 }, []);

      expect(spec.width).toBe(92);
      expect(spec.height).toBe(46);
    });

    it('fits a tall (portrait) slide within the square box, keeping aspect', () => {
      const config = { ...baseConfig(), miniPlot: true };
      config.dimensions = { ...config.dimensions, width: 92, height: 92 };
      // 500x1000 → aspect 0.5 (< 1): height = box(92), width = box*aspect = 46
      const spec = generateSpec(config, 'mock', { imageWidth: 500, imageHeight: 1000 }, []);

      expect(spec.height).toBe(92);
      expect(spec.width).toBe(46);
    });

    it('keeps the configured dimensions for the full (non-mini) plot', () => {
      const config = { ...baseConfig(), miniPlot: false };
      config.dimensions = { ...config.dimensions, width: 700, height: 550 };
      const spec = generateSpec(config, 'mock', imageData, []);

      expect(spec.width).toBe(700);
      expect(spec.height).toBe(550);
    });
  });

  describe('title and axes omission on mini plots', () => {
    it('omits the title and padding on a mini plot', () => {
      const config = { ...baseConfig(), miniPlot: true };
      const spec = generateSpec(config, 'mock', imageData, []);

      expect(spec.title).toBeUndefined();
      expect(spec.padding).toBe(0);
    });

    it('renders a title and padding on the full plot', () => {
      const config = { ...baseConfig(), miniPlot: false };
      const spec = generateSpec(config, 'mock', imageData, []);

      expect(spec.title).toBeDefined();
      expect(spec.padding).toBe(5);
    });

    it('omits axes on a mini plot even when axis labels are enabled', () => {
      const config = { ...baseConfig(), miniPlot: true };
      config.axes = { ...config.axes, xAxisLabels: true, yAxisLabels: true };
      const spec = generateSpec(config, 'mock', imageData, []);

      expect(spec.axes).toEqual([]);
    });
  });
});

describe('filterCells / generateData', () => {
  let mockCellSetsReduxObject;
  let mockEmbeddingData;

  beforeEach(() => {
    mockCellSetsReduxObject = {
      properties: createPropertiesFromTree(mockCellSets),
      hierarchy: createHierarchyFromTree(mockCellSets),
    };
    mockEmbeddingData = _.range(30).map((i) => [i, i + 1]);
  });

  it('filterCells returns a Set of every cell id when selectedSample is All', () => {
    const result = filterCells(mockCellSetsReduxObject, 'All');
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBeGreaterThan(0);
  });

  it('filterCells returns only the chosen sample cell ids', () => {
    const sampleKey = 'b62028a1-ffa0-4f10-823d-93c9ddb88898';
    const all = filterCells(mockCellSetsReduxObject, 'All');
    const sample = filterCells(mockCellSetsReduxObject, sampleKey);

    expect(sample.size).toBeGreaterThan(0);
    expect(sample.size).toBeLessThanOrEqual(all.size);
    // every sample cell is a subset of all cells
    [...sample].forEach((id) => expect(all.has(id)).toBe(true));
  });

  it('generateData maps filtered cell ids to {x, y, value} from embedding + plotData', () => {
    const plotData = _.range(30).map((i) => i * 10);
    const result = generateData(mockCellSetsReduxObject, 'All', plotData, mockEmbeddingData);

    expect(result.length).toBeGreaterThan(0);
    result.forEach((datum) => {
      expect(datum).toHaveProperty('x');
      expect(datum).toHaveProperty('y');
      expect(datum).toHaveProperty('value');
    });

    // x/y come from the embedding coordinate, value from plotData[cellId]
    const sample = result[0];
    expect(sample.y).toBe(sample.x + 1);
    expect(sample.value).toBe(sample.x * 10);
  });

  it('generateData drops cells whose embedding coordinate is undefined', () => {
    const sparseEmbedding = _.range(30).map((i) => (i % 2 === 0 ? [i, i] : undefined));
    const plotData = _.range(30).map((i) => i);
    const result = generateData(mockCellSetsReduxObject, 'All', plotData, sparseEmbedding);

    // only even cell ids survive
    result.forEach((datum) => expect(datum.x % 2).toBe(0));
  });
});
