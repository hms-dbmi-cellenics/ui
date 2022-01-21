import React from 'react';
import { screen, render } from '@testing-library/react';
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

import { runPipeline } from 'redux/actions/pipeline';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import { modules } from 'utils/constants';

jest.mock('components/UserButton', () => () => <></>);

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
  runPipeline: jest.fn(() => ({ type: 'RUN_PIPELINE' })),
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

  const store = mockStore(_.merge(initialState, settings));

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

describe('DataProcessingPage', () => {
  it('Renders the first page correctly', () => {
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

  it('Triggers the pipeline on click run filter', () => {
    const store = getStore(experimentId, { experimentSettings: { processing: { meta: { changedQCFilters: new Set(['classifier']) } } } });

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

    userEvent.click(screen.getByText('Start'));

    expect(runPipeline).toHaveBeenCalled();
  });

  it('Classifier filter (1st filter) should show custom disabled message if sample is prefiltered ', () => {
    const store = getStore(
      experimentId,
      {
        experimentSettings: {
          processing: {
            classifier: {
              enabled: false,
              prefiltered: true,
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

  it('Classifier filter (1st filter) should not be disabled and not show error if not prefiltered ', () => {
    const store = getStore(
      experimentId,
      {
        experimentSettings: {
          processing: {
            classifier: {
              enabled: true,
              prefiltered: false,
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

    // Button show should show "Disable"
    const disableButton = screen.getByText(/Disable/i).closest('button');

    expect(disableButton).toBeInTheDocument();
    expect(disableButton).toBeEnabled();

    expect(screen.queryByText(/is pre-filtered/i)).toBeNull();
  });

  it('A disabled filter shows a warning', () => {
    const store = getStore(
      experimentId,
      {
        experimentSettings: {
          processing: {
            classifier: {
              enabled: false,
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

  it('Shows a wait screen if pipeline is still running', () => {
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
