import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';
import { downsamplingMethods } from 'utils/constants';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import '__test__/test-utils/setupTests';

import { screen, render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculationConfig from 'components/data-processing/DataIntegration/CalculationConfig';
import fake from '__test__/test-utils/constants';

jest.mock('redux/selectors');

const dataIntegrationEmbeddingConfig = initialPlotConfigStates.dataIntegrationEmbedding;
const dataIntegrationFrequencyConfig = initialPlotConfigStates.dataIntegrationFrequency;
const dataIntegrationElbowConfig = initialPlotConfigStates.dataIntegrationElbow;

const filterName = 'dataIntegration';
const configureEmbeddingFilterName = 'configureEmbedding';

const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

const PCObject = () => ({ PC: 1, percent: 0.02, percentVariance: 0.02 });

const initialState = {
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
    [generateDataProcessingPlotUuid(null, filterName, 1)]: {
      config: dataIntegrationElbowConfig,
      plotData: Array(50).fill(PCObject()),
    },
    dataIntegrationFrequency: {
      config: dataIntegrationFrequencyConfig,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, configureEmbeddingFilterName, 1)]: {
      config: dataIntegrationEmbeddingConfig,
      plotData: [],
    },
  },

};

describe('DataIntegration.CalculationConfig', () => {
  const renderCalculationConfig = async (storeState) => {
    const mockedStore = mockStore(storeState);
    return await render(
      <Provider store={mockedStore}>
        <CalculationConfig
          experimentId={fake.EXPERIMENT_ID}
          changedFilters={{ current: new Set() }}
          onConfigChange={jest.fn()}
        />
      </Provider>,
    );
  };

  it('renders correctly when data is in the store', async () => {
    await renderCalculationConfig(initialState);

    expect(screen.getByText('Data Integration')).toBeDefined();
    expect(screen.getByText('Downsampling Options')).toBeDefined();
  });

  it('renders correctly when nothing is loaded', async () => {
    const state = {
      embeddings: {},
      experimentSettings: {
        ...initialExperimentState,
      },
      componentConfig: {
        [generateDataProcessingPlotUuid(null, filterName, 1)]: {
          config: {},
          plotData: [],
        },
      },
    };

    await renderCalculationConfig(state);
  });

  it('downsampling options disabled by default', async () => {
    await renderCalculationConfig(initialState);

    userEvent.click(screen.getByText('Downsampling Options'));
    expect(screen.getByText('No Downsampling')).toBeDefined();
    const inputPercToKeep = screen.getByLabelText('% of cells to keep');
    expect(inputPercToKeep).toBeDisabled();
  });

  it('downsampling displays geosketch values correctly', async () => {
    const stateWithDownsampling = initialState;
    stateWithDownsampling.experimentSettings.processing.dataIntegration.downsampling = {
      method: downsamplingMethods.GEOSKETCH,
      methodSettings: {
        [downsamplingMethods.GEOSKETCH]: {
          percentageToKeep: 12,
        },
      },
    };

    renderCalculationConfig(stateWithDownsampling);

    userEvent.click(screen.getByText('Downsampling Options'));

    expect(screen.getByText('Geometric Sketching')).toBeDefined();
    const input = screen.getByLabelText('% of cells to keep');
    expect(input.value).toEqual('12');

    userEvent.type(input, '{backspace}{backspace}3');
    expect(input.value).toEqual('3');
  });

  it('displays the correct proportion of variation explained value', async () => {
    await renderCalculationConfig(initialState);
    expect(screen.getByDisplayValue('60')).toBeDefined();

    const input = screen.getByLabelText('Number of Principal Components');

    userEvent.type(input, '{backspace}{backspace}10');
    expect(input.value).toEqual('10');
    // expect(screen.getByDisplayValue('60')).toBeDefined();
  });
});
