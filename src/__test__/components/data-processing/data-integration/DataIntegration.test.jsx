import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';

import DataIntegration from 'components/data-processing/DataIntegration/DataIntegration';
import CalculationConfig from 'components/data-processing/DataIntegration/CalculationConfig';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import { getBackendStatus, getCellSets } from 'redux/selectors';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import '__test__/test-utils/setupTests';

jest.mock('redux/selectors');

const dataIntegrationEmbeddingConfig = initialPlotConfigStates.dataIntegrationEmbedding;
const dataIntegrationFrequencyConfig = initialPlotConfigStates.dataIntegrationFrequency;
const dataIntegrationElbowConfig = initialPlotConfigStates.dataIntegrationElbow;

const filterName = 'dataIntegration';
const configureEmbeddingFilterName = 'configureEmbedding';

const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

const mockedStore = mockStore({
  embeddings: {
    ...initialEmbeddingState,
    umap: {
      data: [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
        [9, 10],
        [11, 12],
      ],
      loading: false,
      error: false,
    },
  },
  cellSets: mockCellSets,
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    dataIntegrationFrequency: {
      config: dataIntegrationFrequencyConfig,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, configureEmbeddingFilterName, 1)]: {
      config: dataIntegrationEmbeddingConfig,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, filterName, 1)]: {
      config: dataIntegrationElbowConfig,
      plotData: [],
    },
  },
});

describe('DataIntegration', () => {
  beforeEach(() => {
    getCellSets.mockReturnValue(() => (mockCellSets));
  });

  it('renders correctly', () => {
    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: { pipeline: { completedSteps: ['ConfigureEmbedding'] } },
    }));

    const store = mockedStore;
    const component = mount(
      <Provider store={store}>
        <DataIntegration
          experimentId='1234'
          onPipelineRun={jest.fn()}
          onConfigChange={jest.fn()}
        />
      </Provider>,
    );

    const dataIntegration = component.find(DataIntegration).at(0);
    const calculationConfig = dataIntegration.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = dataIntegration.find(Vega);

    // There are 4 plots (1 main and 3 miniatures)
    expect(plots.length).toEqual(4);
  });

  it('doesnt show plots that depend on configure embedding if it hasnt finished running yet', () => {
    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: { pipeline: { completedSteps: [] } },
    }));
    const store = mockedStore;

    const component = mount(
      <Provider store={store}>
        <DataIntegration
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    const dataIntegration = component.find(DataIntegration).at(0);
    const calculationConfig = dataIntegration.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    // Only elbow plot is shown
    expect(dataIntegration.find('ElbowPlot')).toHaveLength(1);
    expect(dataIntegration.find('CategoricalEmbeddingPlot')).toHaveLength(0);
    expect(dataIntegration.find('FrequencyPlot')).toHaveLength(0);
  });

  it('doesnt crash if backend status is null', () => {
    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: null,
    }));
    const store = mockedStore;

    const component = mount(
      <Provider store={store}>
        <DataIntegration
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    const dataIntegration = component.find(DataIntegration).at(0);
    const calculationConfig = dataIntegration.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    // Only elbow plot is shown
    expect(dataIntegration.find('ElbowPlot')).toHaveLength(1);
    expect(dataIntegration.find('CategoricalEmbeddingPlot')).toHaveLength(0);
    expect(dataIntegration.find('FrequencyPlot')).toHaveLength(0);
  });
});
