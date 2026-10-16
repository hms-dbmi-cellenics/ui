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

  it('Plot data alone from the pipeline does not leave config changes to save', () => {
    const updateReturn = updateReducer({}, {
      type: UPDATE_CONFIG,
      payload: {
        dataChanges: [{ PC: 1, percentVariance: 0.1 }],
        plotUuid: 'dataIntegration-1',
      },
    });

    expect(updateReturn['dataIntegration-1'].plotData).toEqual([{ PC: 1, percentVariance: 0.1 }]);
    expect(updateReturn['dataIntegration-1'].config).toBeUndefined();
    expect(updateReturn['dataIntegration-1'].outstandingChanges).toBe(false);
  });

  it('Plot data keeps existing unsaved config changes', () => {
    const state = { volcanoPlotMain: { config: { height: 1 }, outstandingChanges: true } };
    const updateReturn = updateReducer(state, {
      type: UPDATE_CONFIG,
      payload: { dataChanges: [], plotUuid: 'volcanoPlotMain' },
    });

    expect(updateReturn.volcanoPlotMain.outstandingChanges).toBe(true);
  });

  it('Expands columnar plot data from QC updates', () => {
    const updateReturn = updateReducer({}, {
      type: UPDATE_CONFIG,
      payload: {
        plotUuid: 'sample-spatialUmiOutlier-0',
        dataChanges: { columnar: { cellId: [0, 1], value: [2, 3] } },
      },
    });

    expect(updateReturn['sample-spatialUmiOutlier-0'].plotData).toEqual([
      { cellId: 0, value: 2 }, { cellId: 1, value: 3 },
    ]);
  });
});
