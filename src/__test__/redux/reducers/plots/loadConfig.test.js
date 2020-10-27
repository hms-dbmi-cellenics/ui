import loadReducer from '../../../../redux/reducers/plots/loadConfig';
import * as types from '../../../../redux/actionTypes';

describe('loadConfig', () => {
  it('Config loaded', () => expect(
    loadReducer({}, {
      payload: {
        experimentId: '1234',
        plotUuid: 'embeddingCategoricalMain',
      },
      type: types.LOAD_PLOT_CONFIG,
    }),
  ).toEqual({
    experimentId: '1234',
    plotUuid: 'embeddingCategoricalMain',
  }));
});
