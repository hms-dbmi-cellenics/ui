import _ from 'lodash';
import updateReducer from 'redux/reducers/componentConfig/updateConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { UPDATE_CONFIG, LOAD_CONFIG } from 'redux/actionTypes/componentConfig';
import loadReducer from 'redux/reducers/componentConfig/loadConfig';

describe('updateConfig', () => {
  it('Checking if fields changed', () => {
    const newState = loadReducer({}, {
      type: LOAD_CONFIG,
      payload: {
        experimentId: '1234',
        plotUuid: 'volcanoPlotMain',
        plotType: 'volcano',
        config: _.cloneDeep(initialPlotConfigStates.volcano),
        plotData: [],
      },
    });
    const updateReturn = updateReducer(newState, {
      type: UPDATE_CONFIG,
      payload: {
        configChanges: { height: 2000 },
        plotUuid: 'volcanoPlotMain',
      },
    });
    expect(updateReturn).toMatchSnapshot();
  });
  it('Checking if empty update doesnt change anything', () => {
    const newState = loadReducer({}, {
      type: LOAD_CONFIG,
      payload: {
        experimentId: '1234',
        plotUuid: 'embeddingCategoricalMain',
        plotType: 'embeddingCategorical',
        config: _.cloneDeep(initialPlotConfigStates.embeddingCategorical),
        plotData: [],
      },
    });
    const updateReturn = updateReducer(newState, {
      type: UPDATE_CONFIG,
      payload: {
        configChanges: {},
        plotUuid: 'embeddingCategoricalMain',
      },
    });
    expect(updateReturn).toMatchSnapshot();
  });
});
