import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import _ from 'lodash';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import DataProcessingPage from 'pages/experiments/[experimentId]/data-processing/index';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import initialCellSetsState from 'redux/reducers/cellSets/initialState';
import initialSamplesState, { sampleTemplate } from 'redux/reducers/samples/initialState';

import { getBackendStatus } from 'redux/selectors';
import '__test__/test-utils/setupTests';

import { runQC } from 'redux/actions/pipeline';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import { modules } from 'utils/constants';
import { act } from 'react-dom/test-utils';
import { saveProcessingSettings } from 'redux/actions/experimentSettings';
import { cloneExperiment } from 'redux/actions/experiments';
import { EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED } from 'redux/actionTypes/experimentSettings';
import config from 'config';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('redux/actions/experimentSettings/processingConfig/saveProcessingSettings');
jest.mock('redux/actions/experiments', () => ({
  cloneExperiment: jest.fn(() => () => { }),
  loadExperiments: jest.fn(() => () => { }),
}));

// Mock all filter components
jest.mock('components/data-processing/CellSizeDistribution/CellSizeDistribution', () => () => <></>);
jest.mock('components/data-processing/MitochondrialContent/MitochondrialContent', () => () => <></>);
jest.mock('components/data-processing/GenesVsUMIs/GenesVsUMIs', () => () => <></>);
jest.mock('components/data-processing/DoubletScores/DoubletScores', () => () => <></>);
jest.mock('components/data-processing/DataIntegration/DataIntegration', () => () => <></>);
jest.mock('components/data-processing/ConfigureEmbedding/ConfigureEmbedding', () => () => <></>);

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

jest.mock('redux/selectors');

jest.mock('redux/actions/pipeline', () => ({
  runQC: jest.fn(() => ({ type: 'RUN_PIPELINE' })),
}));

const mockStore = configureMockStore([thunk]);

const sampleIds = ['sample-1'];

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

getBackendStatus.mockImplementation(() => () => ({
  loading: false,
  error: false,
  status: {
    pipeline: {
      status: 'SUCCEEDED',
      completedSteps: [
        'CellSizeDistributionFilter',
        'MitochondrialContentFilter',
        'ClassifierFilter',
        'NumGenesVsNumUmisFilter',
        'DoubletScoresFilter',
      ],
    },
  },
}));

const getStore = (experimentId, settings = {}) => {
  const initialState = {
    experimentSettings: {
      ...initialExperimentState,
      info: {
        ...initialExperimentState.info,
        pipelineVersion: config.pipelineVersionToRerunQC,
        sampleIds,
      },
      processing: {
        ...initialExperimentState.processing,
        meta: {
          loading: false,
          stepsDone: new Set([]),
          loadingSettingsError: false,
          completingStepError: false,
          changedQCFilters: new Set(),
        },
      },
    },
    experiments: { [experimentId]: {} },
    componentConfig: { ...initialPlotConfigStates },
    cellSets: { ...initialCellSetsState },
    samples: {
      ...initialSamplesState,
      ids: sampleIds,
      meta: {
        loading: false,
        error: false,
      },
      'sample-1': {
        ...sampleTemplate,
        name: 'sample-1',
      },
    },
  };
  const newState = _.cloneDeep(initialState);
  const store = mockStore(_.merge(newState, settings));

  return store;
};

const experimentId = 'experimentId';
const experimentData = {};
const route = `localhost:3000/${experimentId}/data-processing`;

const defaultProps = {
  experimentId,
  experimentData,
  route,
};

const dataProcessingPageFactory = createTestComponentFactory(DataProcessingPage, defaultProps);

enableFetchMocks();

describe('DataProcessingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Renders the first page correctly', () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore();

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    // It contains the title Data Processing
    const titles = screen.getAllByText('Data Processing');

    // One for breadcrumb, one for title
    expect(titles).toHaveLength(1);

    // It shows the first filter step - Classifier filter
    expect(screen.getByText(/Classifier/i)).toBeInTheDocument();

    // It shows a Disable filter button, which should be enabled by default
    expect(screen.getByText(/Disable/i).closest('button')).toBeEnabled();

    // It shows the status indicator (which has "Status wording")
    expect(screen.getByText(/status/i)).toBeInTheDocument();

    // gets the previous button

    const prevButton = screen.getByRole('img', { name: 'left' });
    expect(prevButton.closest('button')).toBeInTheDocument();

    // It contains a next button - the first button showing the "right" arrow image
    const nextButton = screen.getAllByRole('img', { name: 'right' })[0];
    expect(nextButton.closest('button')).toBeInTheDocument();
  });

  it('Last button of the filter should redirect to Data Exploration', () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore();

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    const numQcSteps = 7;

    // -1 because you only need n-1 clicks to go from page 1 to page n
    const numClicksUntilLastFilter = numQcSteps - 1;

    const nextButton = screen.getAllByRole('img', { name: 'right' })[0];

    // Click next button n times until the end
    for (let i = 0; i < numClicksUntilLastFilter; i += 1) {
      userEvent.click(nextButton);
    }

    // Expect there to be the check button
    // 1st check = check in the dropdown box
    // 2nd check = check in the status bar
    // 3rd check = check in the finish qc button
    const finishQcButton = screen.getAllByRole('img', { name: /check/i })[2];

    expect(finishQcButton).toBeInTheDocument();

    // Clicking finish button should redirect to Data Processing page
    finishQcButton.click();

    expect(mockNavigateTo).toHaveBeenCalled();

    const url = mockNavigateTo.mock.calls[0][0];
    expect(url).toEqual(modules.DATA_EXPLORATION);
  });

  it('Triggers the pipeline on click run filter', async () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore(experimentId, { experimentSettings: { processing: { meta: { changedQCFilters: new Set(['classifier']) } } } });
    await act(() => {
      render(
        <Provider store={store}>
          {dataProcessingPageFactory()}
        </Provider>,
      );
    });

    // Change settings by clicking on the "manual" radio button
    const manualButton = screen.getByText('Manual');

    userEvent.click(manualButton);

    // Click on the run button
    userEvent.click(screen.getByText('Run'));

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    // Click on the start button
    userEvent.click(screen.getByText('Start'));

    expect(runQC).toHaveBeenCalled();
  });

  it('Shows extra information if there is a new version of the QC pipeline', async () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore(experimentId, {
      experimentSettings: {
        info: { pipelineVersion: config.pipelineVersionToRerunQC - 1 },
        processing: { meta: { changedQCFilters: new Set(['classifier']) } },
      },
    });

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    // Change settings by clicking on the "manual" radio button
    userEvent.click(screen.getByText('Manual'));

    // Click on the run button
    userEvent.click(screen.getByText('Run'));

    await waitFor(() => {
      expect(screen.getByText(/Due to a recent update, re-running the pipeline will initiate the run from the beginning/)).toBeInTheDocument();
    });

    // The Start text is the 1st element with "Start" in it
    const startText = screen.getAllByText('Start')[0];

    expect(startText).toBeInTheDocument();
    expect(screen.getByText(/to re-run this project analysis from the beginning. Note that you will lose all of your annotated cell sets./)).toBeInTheDocument();

    // The Clone Project text is the 1st element with "Clone Project" in it
    const cloneProjectText = screen.getAllByText('Clone Project')[0];
    expect(cloneProjectText).toBeInTheDocument();
    expect(screen.getByText(/to clone this project and run from the beginning for the new project only./)).toBeInTheDocument();
    expect(screen.getByText(/Your current project will not re-run, and will still be available to explore./)).toBeInTheDocument();

    // The Cancel text is the 1st element with "Cancel" in it
    const cancelText = screen.getAllByText('Cancel')[0];
    expect(cancelText).toBeInTheDocument();
    expect(screen.getByText(/to close this popup. You can then choose to discard the changed settings in your current project./)).toBeInTheDocument();

    // There should be 3 buttons
    // The start button is the 2nd element with "Start" in it
    const startButton = screen.getAllByText('Start')[1];
    expect(startButton).toBeInTheDocument();

    // The clone project button is the 2nd element with "Clone Project" in it
    const cloneProjectButton = screen.getAllByText('Clone Project')[1];
    expect(cloneProjectButton).toBeInTheDocument();

    // The cancel button is the 3rd element with "Cancel" in it
    const cancelButton = screen.getAllByText('Cancel')[1];
    expect(cancelButton).toBeInTheDocument();

    // Clicking the Clone Project button will call the clone experiment action

    userEvent.click(cloneProjectButton);

    await waitFor(() => {
      expect(cloneExperiment).toHaveBeenCalledTimes(1);
      expect(mockNavigateTo).toHaveBeenCalledTimes(1);
    });
  });

  it('Shows not authorized modal if user cant rerun the experiment', async () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(false)));

    const store = getStore(experimentId, {
      experimentSettings: {
        info: { pipelineVersion: config.pipelineVersionToRerunQC },
        processing: { meta: { changedQCFilters: new Set(['classifier']) } },
      },
    });

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    // Change settings by clicking on the "manual" radio button
    userEvent.click(screen.getByText('Manual'));

    // Click on the run button
    userEvent.click(screen.getByText('Run'));

    await waitFor(() => {
      expect(
        screen.getByText(/Your account is not authorized to run data processing on this project. You have 2 options:/),
      ).toBeInTheDocument();
    });

    // The Clone Project text is the 1st element with "Clone Project" in it
    const cloneProjectText = screen.getAllByText('Clone Project')[0];
    expect(cloneProjectText).toBeInTheDocument();
    expect(screen.getByText(/to clone this project and run from the beginning for the new project only./)).toBeInTheDocument();
    expect(screen.getByText(/Your current project will not re-run, and will still be available to explore./)).toBeInTheDocument();

    // The Cancel text is the 1st element with "Cancel" in it
    const cancelText = screen.getAllByText('Cancel')[0];
    expect(cancelText).toBeInTheDocument();
    expect(screen.getByText(/to close this popup. You can then choose to discard the changed settings in your current project./)).toBeInTheDocument();

    // There should be 2 buttons

    // The clone project button is the 2nd element with "Clone Project" in it
    const cloneProjectButton = screen.getAllByText('Clone Project')[1];
    expect(cloneProjectButton).toBeInTheDocument();

    // The cancel button is the 3rd element with "Cancel" in it
    const cancelButton = screen.getAllByText('Cancel')[1];
    expect(cancelButton).toBeInTheDocument();

    // Clicking the Clone Project button will call the clone experiment action

    userEvent.click(cloneProjectButton);

    await waitFor(() => {
      expect(cloneExperiment).toHaveBeenCalledTimes(1);
      expect(mockNavigateTo).toHaveBeenCalledTimes(1);
    });
  });

  it('Should not show extra information if there is no new version of the QC pipeline', async () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore(experimentId, {
      experimentSettings: {
        processing: { meta: { changedQCFilters: new Set(['classifier']) } },
      },
    });

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    // Change settings by clicking on the "manual" radio button
    const manualButton = screen.getByText('Manual');

    userEvent.click(manualButton);

    // Click on the run button
    userEvent.click(screen.getByText('Run'));

    // There should be no update information
    expect(screen.queryByText(/Due to a recent update, re-running the pipeline will initiate the run from the beginning/)).toBeNull();

    // There should only be 2 buttons
    await waitFor(async () => {
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('Classifier filter (1st filter) should show custom disabled message if sample is prefiltered ', () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore(
      experimentId,
      {
        experimentSettings: {
          processing: {
            classifier: {
              [sampleIds[0]]: {
                prefiltered: true,
                enabled: false,
                auto: true,
                filterSettings: {
                  FDR: 0.1,
                },
              },
            },
          },
        },
      },
    );

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    // Button show should show "Enable" because filter is disabled
    const enableButton = screen.getByText(/Enable/i).closest('button');

    expect(enableButton).toBeInTheDocument();
    expect(enableButton).toBeDisabled();

    expect(screen.getByText(/is pre-filtered/i)).toBeInTheDocument();
  });

  it('Classifier filter (1st filter) should not be disabled and not show error if not prefiltered ', async () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore();

    await render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    // Button show should show "Disable"
    const disableButton = screen.getByText(/Disable/i).closest('button');

    expect(disableButton).toBeInTheDocument();
    expect(disableButton).toBeEnabled();

    expect(screen.queryByText(/is pre-filtered/i)).toBeNull();
  });

  it('A disabled filter shows a warning', async () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore(
      experimentId,
      {
        experimentSettings: {
          processing: {
            classifier: {
              [sampleIds[0]]: {
                enabled: false,
              },
            },
          },
        },
      },
    );

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    userEvent.click(screen.getByText(/Disable/i));

    expect(screen.getByText(/This filter is disabled/i)).toBeInTheDocument();
  });

  it('Disabling a filter saves and dispatches appropriate actions', async () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    const store = getStore(experimentId);
    saveProcessingSettings.mockImplementation(() => () => Promise.resolve());
    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    act(() => userEvent.click(screen.getByText(/Disable/i)));
    expect(saveProcessingSettings).toHaveBeenCalled();

    await waitFor(() => {
      expect(_.map(store.getActions(), 'type')).toContain(EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED);
    });
  });

  it('Shows a wait screen if pipeline is still running', () => {
    fetchMock.mockIf(new RegExp(`/v2/access/${experimentId}/check?.*`), () => Promise.resolve(JSON.stringify(true)));

    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: {
        pipeline: {
          status: 'RUNNING',
          completedSteps: [],
        },
      },
    }));

    const store = getStore();

    render(
      <Provider store={store}>
        {dataProcessingPageFactory()}
      </Provider>,
    );

    expect(screen.getByText(/Your data is getting ready./i)).toBeInTheDocument();
  });
});
