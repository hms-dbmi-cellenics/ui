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
});
