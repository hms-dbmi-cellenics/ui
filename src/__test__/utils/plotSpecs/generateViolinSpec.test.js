import _ from 'lodash';

import { generateData, generateSpec } from 'utils/plotSpecs/generateViolinSpec';
import { mockCellSets as cellSets } from '__test__/test-utils/cellSets.mock';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

describe('generateData', () => {
  const MOCK_RANDOM = 0.1;
  const MOCK_EXPECTED_RANDOM = 0.25 + MOCK_RANDOM / 2;
  const mockGeneExpression = [0, 1, 2, 3, 4, 5, null];
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(MOCK_RANDOM);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('generates data when grouping by lovain clusters', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['cluster-a', 'cluster-b', 'cluster-c']);
    expect(plotData.groups['cluster-a']).toEqual({ name: 'cluster a', color: '#01FFFF' });

    const expectedCells = [
      { group: 'cluster-a', y: 0, x: MOCK_EXPECTED_RANDOM },
      { group: 'cluster-a', y: 1, x: MOCK_EXPECTED_RANDOM },
      { group: 'cluster-b', y: 2, x: MOCK_EXPECTED_RANDOM },
      { group: 'cluster-b', y: 3, x: MOCK_EXPECTED_RANDOM },
      { group: 'cluster-c', y: 4, x: MOCK_EXPECTED_RANDOM },
      { group: 'cluster-c', y: 5, x: MOCK_EXPECTED_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates data when grouping by sample', () => {
    const groupingId = 'sample';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['sample-1', 'sample-2']);
    expect(plotData.groups['sample-1']).toEqual({ name: 'Sample 1', color: '#012FFF' });

    const expectedCells = [
      { group: 'sample-1', y: 0, x: MOCK_EXPECTED_RANDOM },
      { group: 'sample-1', y: 1, x: MOCK_EXPECTED_RANDOM },
      { group: 'sample-1', y: 2, x: MOCK_EXPECTED_RANDOM },
      { group: 'sample-2', y: 3, x: MOCK_EXPECTED_RANDOM },
      { group: 'sample-2', y: 4, x: MOCK_EXPECTED_RANDOM },
      { group: 'sample-2', y: 5, x: MOCK_EXPECTED_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates data when grouping by scratchpad', () => {
    const groupingId = 'scratchpad';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['scratchpad-a']);
    expect(plotData.groups['scratchpad-a']).toEqual({ name: 'New Cluster', color: '#5FFFFF' });

    const expectedCells = [
      { group: 'scratchpad-a', y: 5, x: MOCK_EXPECTED_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates the x value for only the cells in the specified group', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'sample/sample-1');
    const expectedCells = [
      { group: 'cluster-a', y: 0, x: MOCK_EXPECTED_RANDOM },
      { group: 'cluster-a', y: 1, x: MOCK_EXPECTED_RANDOM },
      { group: 'cluster-b', y: 2, x: MOCK_EXPECTED_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generate spec returns the right data', () => {
    const data = {
      groups: {
        '8297d513-6268-4ab0-a03e-e74a23ecec07': {
          name: 'New Cluster',
          color: '#3957ff',
        },
        '99a7746b-7f9d-4e54-8acf-53031e4ff023': {
          name: 'New Cluster2',
          color: '#d3fe14',
        },
        '25ca1d7f-40ac-4bdc-9625-2272478e7db7': {
          name: 'New Cluster3',
          color: '#c9080a',
        },
        'b452c7ed-d907-4923-b7ff-fcafadc0b807': {
          name: 'New Cluster4',
          color: '#fec7f8',
        },
      },
      cells: [{
        group: '8297d513-6268-4ab0-a03e-e74a23ecec07',
        y: -0.1578865578865579,
        x: 0.5561686241217735,
      },
      {
        group: '8297d513-6268-4ab0-a03e-e74a23ecec07',
        y: -0.1578865578865579,
        x: 0.5683293645580038,
      },
      {
        group: '8297d513-6268-4ab0-a03e-e74a23ecec07',
        y: -0.1578865578865579,
        x: 0.4433627345700756,
      }],
      settings: {
        groupingName: 'Custom cell sets',
      },
    };
    const config = initialPlotConfigStates.violin;
    config.legend.enabled = true;
    const spec = generateSpec(config, data);
    expect(spec).toMatchSnapshot();
  });
});
