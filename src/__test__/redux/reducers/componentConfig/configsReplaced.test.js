import configsReplacedReducer from 'redux/reducers/componentConfig/configsReplaced';

import updatedConfigs from '__test__/redux/reducers/componentConfig/mock/updatedConfigs.json';
import _ from 'lodash';

import reduxState from '__test__/redux/reducers/componentConfig/mock/reduxState.json';
import { CONFIGS_REPLACED } from 'redux/actionTypes/componentConfig';

describe('configsReplaced', () => {
  it('Replaces existing state', () => {
    const newState = configsReplacedReducer(
      reduxState,
      {
        type: CONFIGS_REPLACED,
        payload: { updatedConfigs },
      },
    );

    // Parts of the config removed are replaced with initial state
    expect(newState.embeddingCategoricalMain.config.selectedSample).toEqual('All');
    expect(newState.embeddingCategoricalMain.config.selectedCellSet).toEqual('louvain');

    expect(newState.frequencyPlotMain.config.xAxisGrouping).toEqual('sample');
    expect(newState.frequencyPlotMain.config.proportionGrouping).toEqual('louvain');

    expect(newState.trajectoryAnalysisMain.config.selectedNodes).toEqual([]);

    expect(newState.ViolinMain.config.selectedPoints).toEqual('All');
    expect(newState.ViolinMain.config.selectedCellSet).toEqual('louvain');

    expect(newState['ViolinMain-0'].config.selectedPoints).toEqual('All');
    expect(newState['ViolinMain-0'].config.selectedCellSet).toEqual('louvain');

    // Nothing else changed
    expect(newState).toMatchSnapshot();
  });

  // This is expected because, in most plots, we assume that
  // if the config was loaded, then the plotData was too.
  // However, these config updates received from the api don't contain the plotData
  // so we shouldn't store them to maintain the invariant
  it('Doesnt to redux config that was not loaded', () => {
    const originalState = _.cloneDeep(reduxState);

    delete originalState.embeddingCategoricalMain;

    const newState = configsReplacedReducer(
      originalState,
      {
        type: CONFIGS_REPLACED,
        payload: { updatedConfigs },
      },
    );

    // While there is an update for embeddingCategoricalMain, the new state doesnt store it
    expect(updatedConfigs.find(({ id }) => id === 'embeddingCategoricalMain')).toBeDefined();
    expect(newState.embeddingCategoricalMain).not.toBeDefined();
  });
});
