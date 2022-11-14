import configsReplacedReducer from 'redux/reducers/componentConfig/configsReplaced';

import updatedConfigs from '__test__/redux/reducers/componentConfig/mock/updatedConfigs.json';
import originalState from '__test__/redux/reducers/componentConfig/mock/originalState.json';
import { CONFIGS_REPLACED } from 'redux/actionTypes/componentConfig';

describe('configsReplaced', () => {
  it('Replaces existing state', () => {
    const newState = configsReplacedReducer(
      originalState,
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
});
