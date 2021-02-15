import populateFrequencyData from '../../../../components/plots/helpers/populateFrequencyData';

describe('populateFrequencyData', () => {
  let configMock = {};
  let specMock = {};
  let hierarchyMock = [];
  let propertiesMock = {};

  beforeEach(() => {
    specMock = {
      data: [
        {},
      ],
    };

    hierarchyMock = [
      { key: 'sample', children: [{ key: 'sample1' }, { key: 'sample2' }, { key: 'sample3' }] },
      { key: 'louvain', children: [{ key: 'louvain1' }, { key: 'louvain2' }] },
    ];

    propertiesMock = {
      sample1: {
        cellIds: new Set([1, 2, 3, 4]),
        color: 'sample1',
        name: '1',
      },
      sample2: {
        cellIds: new Set([5, 6, 7]),
        color: 'sample2',
        name: '2',
      },
      sample3: {
        cellIds: new Set([8, 9, 10]),
        color: 'sample3',
        name: '3',
      },
      louvain1: {
        cellIds: new Set([1, 2, 5, 8, 10]),
        color: 'louvain1',
        name: '1',
      },
      louvain2: {
        cellIds: new Set([3, 4, 6, 7, 9]),
        color: 'louvain2',
        name: '2',
      },
    };
  });

  test('with louvain as xAxis and sample as proportion', () => {
    configMock = { proportionGrouping: 'sample', xAxisGrouping: 'louvain', frequencyType: 'proportional' };

    populateFrequencyData(specMock, hierarchyMock, propertiesMock, configMock);

    // Should populate with 2 bars, one for each of the louvain clusters
    expect(specMock.data).toMatchSnapshot();
  });

  test('with sample as xAxis and louvain as proportion', () => {
    configMock = { proportionGrouping: 'louvain', xAxisGrouping: 'sample', frequencyType: 'proportional' };

    populateFrequencyData(specMock, hierarchyMock, propertiesMock, configMock);

    // Should populate with 3 bars, one for each of the samples
    expect(specMock.data).toMatchSnapshot();
  });

  test('with empty xAxis and sample as proportion we only get data for sample', () => {
    configMock = { proportionGrouping: 'sample', xAxisGrouping: 'louvain', frequencyType: 'proportional' };

    // Remove grouping that is in xAxis
    hierarchyMock = hierarchyMock.filter((rootNode) => rootNode.key !== 'louvain');

    populateFrequencyData(specMock, hierarchyMock, propertiesMock, configMock);

    // Should populate only with the 3 bars for sample
    expect(specMock.data).toMatchSnapshot();
  });

  test('with empty proportion', () => {
    configMock = { proportionGrouping: 'sample', xAxisGrouping: 'louvain', frequencyType: 'proportional' };

    // Remove grouping that is in proportion
    hierarchyMock = hierarchyMock.filter((rootNode) => rootNode.key !== 'sample');

    populateFrequencyData(specMock, hierarchyMock, propertiesMock, configMock);

    // Should not populate any data
    expect(specMock.data).toMatchSnapshot();
  });

  it('displays data with count instead of percentages when the frequencyType is count', () => {
    configMock = { proportionGrouping: 'sample', xAxisGrouping: 'louvain', frequencyType: 'count' };

    populateFrequencyData(specMock, hierarchyMock, propertiesMock, configMock);

    // Should populate with 2 bars, one for each of the louvain clusters with count
    expect(specMock.data).toMatchSnapshot();
  });
});
