import _ from 'lodash';

import {
  generateSpec, generateData, filterCells,
} from 'utils/plotSpecs/generateSpatialCategoricalSpec';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { plotTypes } from 'utils/constants';
import {
  createHierarchyFromTree,
  createPropertiesFromTree,
} from 'redux/reducers/cellSets/helpers';

const { cellSets: mockCellSets } = require('__test__/data/cell_sets.json');

const baseConfig = () => _.cloneDeep(initialPlotConfigStates[plotTypes.SPATIAL_CATEGORICAL]);
const imageData = { imageWidth: 1000, imageHeight: 500 };
const legendsData = [
  { key: 'louvain-0', name: 'Cluster 0', color: '#111111' },
  { key: 'louvain-1', name: 'Cluster 1', color: '#222222' },
];

describe('generateSpatialCategoricalSpec', () => {
  describe('marks', () => {
    it('renders the tissue image mark only when showImage is true', () => {
      const tissueMark = (config) => generateSpec(config, 'mock', imageData, [], legendsData)
        .marks.find((m) => m.type === 'image' && m.from.data === 'tissueImageData');

      expect(tissueMark({ ...baseConfig(), showImage: true })).toBeDefined();
      expect(tissueMark({ ...baseConfig(), showImage: false })).toBeUndefined();
    });

    it('renders the data-driven segmentation overlay (no dots) when hasSegmentation', () => {
      const spec = generateSpec(baseConfig(), 'mock', imageData, [], legendsData, true);
      const segMark = spec.marks.find(
        (m) => m.type === 'image' && m.from.data === 'segOverlayData',
      );
      const dotMark = spec.marks.find((m) => m.type === 'symbol');

      expect(segMark).toBeDefined();
      expect(dotMark).toBeUndefined();
    });

    it('falls back to centroid dots (from values) when there is no segmentation', () => {
      const spec = generateSpec(baseConfig(), 'mock', imageData, [], legendsData, false);
      const dotMark = spec.marks.find((m) => m.type === 'symbol');

      expect(dotMark).toBeDefined();
      expect(dotMark.from.data).toBe('values');
    });
  });

  describe('mini-plot aspect-fit dimensions', () => {
    it('fits a wide slide within the square box', () => {
      const config = { ...baseConfig(), miniPlot: true };
      config.dimensions = { ...config.dimensions, width: 92, height: 92 };
      const spec = generateSpec(config, 'mock', { imageWidth: 1000, imageHeight: 500 }, [], legendsData);

      expect(spec.width).toBe(92);
      expect(spec.height).toBe(46);
    });

    it('fits a tall slide within the square box', () => {
      const config = { ...baseConfig(), miniPlot: true };
      config.dimensions = { ...config.dimensions, width: 92, height: 92 };
      const spec = generateSpec(config, 'mock', { imageWidth: 500, imageHeight: 1000 }, [], legendsData);

      expect(spec.height).toBe(92);
      expect(spec.width).toBe(46);
    });
  });

  describe('title omission on mini plots', () => {
    it('omits the title on a mini plot', () => {
      const spec = generateSpec({ ...baseConfig(), miniPlot: true }, 'mock', imageData, [], legendsData);
      expect(spec.title).toBeUndefined();
    });

    it('renders the title on the full plot', () => {
      const spec = generateSpec({ ...baseConfig(), miniPlot: false }, 'mock', imageData, [], legendsData);
      expect(spec.title).toBeDefined();
    });
  });

  it('builds the cellSet colour scale range from the legends data', () => {
    const spec = generateSpec(baseConfig(), 'mock', imageData, [], legendsData);
    const labelColors = spec.scales.find(({ name }) => name === 'cellSetLabelColors');

    expect(labelColors.range).toEqual(['#111111', '#222222']);
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

  it('filterCells produces a legend ordered by the cluster hierarchy', () => {
    const { cellSetLegendsData } = filterCells(mockCellSetsReduxObject, 'All', 'louvain');

    const expected = mockCellSets
      .find(({ key }) => key === 'louvain').children
      .map(({ key, name, color }) => ({ key, name, color }));

    expect(cellSetLegendsData).toEqual(expected);
  });

  it('filterCells restricted to a single sample yields a subset of clusters', () => {
    const sampleKey = 'b62028a1-ffa0-4f10-823d-93c9ddb88898';
    const all = filterCells(mockCellSetsReduxObject, 'All', 'louvain');
    const sample = filterCells(mockCellSetsReduxObject, sampleKey, 'louvain');

    expect(sample.cellSetLegendsData.length).toBeLessThanOrEqual(all.cellSetLegendsData.length);
    expect(sample.cellSetLegendsData.length).toBeGreaterThan(0);
  });

  it('generateData attaches cluster key/name/colour and embedding coordinates', () => {
    const { plotData, cellSetLegendsData } = generateData(
      mockCellSetsReduxObject, 'All', 'louvain', mockEmbeddingData,
    );

    expect(cellSetLegendsData.length).toBeGreaterThan(0);
    expect(plotData.length).toBeGreaterThan(0);
    plotData.forEach((datum) => {
      expect(datum).toHaveProperty('x');
      expect(datum).toHaveProperty('y');
      expect(datum).toHaveProperty('cellSetKey');
      expect(datum).toHaveProperty('cellSetName');
      expect(datum).toHaveProperty('color');
    });
  });

  it('generateData drops cells with no embedding coordinate', () => {
    const sparseEmbedding = _.range(30).map((i) => (i % 2 === 0 ? [i, i] : undefined));
    const { plotData } = generateData(mockCellSetsReduxObject, 'All', 'louvain', sparseEmbedding);

    plotData.forEach((datum) => expect(datum.x % 2).toBe(0));
  });
});
