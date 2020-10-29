import _ from 'lodash';
import updateReducer from '../../../../redux/reducers/plots/updateConfig';
import { initialPlotConfigStates } from '../../../../redux/reducers/plots/initialState';
import { UPDATE_PLOT_CONFIG, LOAD_PLOT_CONFIG } from '../../../../redux/actionTypes/plots';
import loadReducer from '../../../../redux/reducers/plots/loadConfig';

describe('updateConfig', () => {
  it('Checking if fields changed', () => {
    const newState = loadReducer({}, {
      type: LOAD_PLOT_CONFIG,
      payload: {
        experimentId: '1234',
        plotUuid: 'volcanoPlotMain',
        config: _.cloneDeep(initialPlotConfigStates.volcano),
      },
    });
    const updateReturn = updateReducer(newState, {
      type: UPDATE_PLOT_CONFIG,
      payload: {
        configChange: { height: 2000 },
        plotUuid: 'volcanoPlotMain',
      },
    });
    expect(updateReturn).toMatchSnapshot();
  });
  it('Checking if empty update doesnt change anything', () => {
    const newState = loadReducer({}, {
      type: LOAD_PLOT_CONFIG,
      payload: {
        experimentId: '1234',
        plotUuid: 'embeddingCategoricalMain',
        config: _.cloneDeep(initialPlotConfigStates.embeddingCategorical),
      },
    });
    const updateReturn = updateReducer(newState, {
      type: UPDATE_PLOT_CONFIG,
      payload: {
        configChange: {},
        plotUuid: 'embeddingCategoricalMain',
      },
    });
    expect(updateReturn).toMatchSnapshot();
  });
});
