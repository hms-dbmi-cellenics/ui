import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';

import DataIntegration from 'components/data-processing/DataIntegration/DataIntegration';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';

import { getBackendStatus, getCellSets } from 'redux/selectors';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import '__test__/test-utils/setupTests';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('redux/selectors');

const dataIntegrationEmbeddingConfig = initialPlotConfigStates.dataIntegrationEmbedding;
const dataIntegrationFrequencyConfig = initialPlotConfigStates.dataIntegrationFrequency;
const dataIntegrationElbowConfig = initialPlotConfigStates.dataIntegrationElbow;

const filterName = 'dataIntegration';
const configureEmbeddingFilterName = 'configureEmbedding';

const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

const embeddingsPlotTitle = 'Embedding coloured by sample';
const elbowPlotTitle = 'Elbow plot showing principal components';
const frequencyPlotTitle = 'Frequency plot coloured by sample';

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
    getCellSets.mockReturnValue(() => ({ accessible: true, ...mockCellSets }));
  });
  const renderDataIntegration = async () => await render(
    <Provider store={mockedStore}>
      <DataIntegration
        experimentId='1234'
        onPipelineRun={jest.fn()}
        onConfigChange={jest.fn()}
      />
    </Provider>,
  );

  it('renders correctly', async () => {
    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: { pipeline: { completedSteps: ['ConfigureEmbedding'] } },
    }));

    await renderDataIntegration();
    screen.debug(null, Infinity);

    expect(screen.getByText('Plot view')).toBeDefined();
    expect(screen.getByText('Data Integration')).toBeDefined();
    expect(screen.getByText('Downsampling Options')).toBeDefined();
    expect(screen.getByText('Plot styling')).toBeDefined();

    const plots = screen.getAllByRole('graphics-document');
    expect(plots.length).toEqual(1);
  });

  it('allows selecting other plots', async () => {
    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: { pipeline: { completedSteps: ['ConfigureEmbedding'] } },
    }));

    await renderDataIntegration();
    const plots = [frequencyPlotTitle, elbowPlotTitle, embeddingsPlotTitle];

    plots.forEach((plot) => {
      userEvent.click(screen.getByText(plot));
      // check that there are two elements with the plot name:
      // * the main plot title
      // * the plot view selector
      expect(screen.getAllByText(plot).length).toEqual(2);
    });
  });

  it('doesnt show plots that depend on configure embedding if it hasnt finished running yet', async () => {
    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: { pipeline: { completedSteps: [] } },
    }));

    await renderDataIntegration();

    // embeddings & frequency plots depend on configure embeddings, if the step
    // has not been completed they both should show the mssage "Nothing to show yet"
    // we don't have to click the embedding as it's shown by default
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();

    userEvent.click(screen.getByText(frequencyPlotTitle));
    expect(screen.queryByText('Nothing to show yet')).toBeInTheDocument();

    // elbow plot does not depend on the configure embedding step
    userEvent.click(screen.getByText(elbowPlotTitle));
    expect(screen.queryByText('Nothing to show yet')).not.toBeInTheDocument();
  });

  it('doesnt crash if backend status is null', async () => {
    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: null,
    }));

    await renderDataIntegration();

    expect(screen.getByText('Plot view')).toBeDefined();
    expect(screen.getByText('Data Integration')).toBeDefined();
    expect(screen.getByText('Plot styling')).toBeDefined();

    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();
  });
});
