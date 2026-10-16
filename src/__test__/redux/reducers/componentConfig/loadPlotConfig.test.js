import loadReducer from 'redux/reducers/componentConfig/loadConfig';

describe('loadPlotConfig', () => {
  it('Config loaded', () => {
    const newState = loadReducer({}, {
      payload: {
        plotUuid: 'embeddingCategoricalMain',
        experimentId: '1234',
      },
    });
    expect(newState).toMatchSnapshot();
  });

  it('Expands columnar plot data on load', () => {
    const newState = loadReducer({}, {
      payload: {
        plotUuid: 'sample-spatialUmiOutlier-0',
        experimentId: '1234',
        plotData: { columnar: { cellId: [5], x: [1.5], y: [2.5] } },
      },
    });

    expect(newState['sample-spatialUmiOutlier-0'].plotData).toEqual([{ cellId: 5, x: 1.5, y: 2.5 }]);
  });
});
