import loadReducer from '../../../../redux/reducers/plots/loadConfig';

describe('loadConfig', () => {
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
