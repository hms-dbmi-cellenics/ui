// import configureMockStore from 'redux-mock-store';
//  import thunk from 'redux-thunk';
import _ from 'lodash';
import updateReducer from '../../../../redux/reducers/plots/updateConfig';
import { initialPlotConfigStates } from '../../../../redux/reducers/plots/initialState';
import { UPDATE_PLOT_CONFIG } from '../../../../redux/actionTypes/plots';
import plotsReducer from '../../../../redux/reducers/plots/index';
//  import initialState from '../../../../redux/reducers/plots/initialState';

describe('updateConfig', () => {
  it('Checking if fields changed', () => {
    //  const mockStore = configureMockStore([thunk]);
    //  const store = mockStore(initialPlotConfigStates.volcanoPlotMain);

    const action = {
      type: UPDATE_PLOT_CONFIG,
      payload: {
        configChange: { height: 500 },
        plotUuid: 'volcanoPlotMain',
        config: _.cloneDeep(initialPlotConfigStates.volcano),
      },
    };
    //  const executeReducer = (state = initialState) => updateReducer(state, action);
    // const reducerOutput = executeReducer();
    //  const reducerOutput = () => executeReducer(initialState);
    //  const reducerOutput = updateReducer(initialState, action);
    //  console.log('FAKE STORE IS ', store);
    console.log('REDUCER OUTPUT from INDEX ', plotsReducer(undefined, action));
    console.log('REDUCER OUTPUT from DIRECTLY ', updateReducer(undefined, action));

    //  expect(reducerOutput).toMatchSnapshot();
  });
});
