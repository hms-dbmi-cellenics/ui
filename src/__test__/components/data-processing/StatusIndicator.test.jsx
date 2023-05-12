import React from 'react';
import {
  screen, render, fireEvent, waitFor,
} from '@testing-library/react';
import StatusIndicator from 'components/data-processing/StatusIndicator';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fake from '__test__/test-utils/constants';
import initialBackendStatusState from 'redux/reducers/backendStatus/initialState';
import pipelineStatus from 'utils/pipelineStatusValues';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

const steps = [
  'ClassifierFilter',
  'CellSizeDistributionFilter',
  'MitochondrialContentFilter',
  'NumGenesVsNumUmisFilter',
  'DoubletScoresFilter',
  'DataIntegration',
  'ConfigureEmbedding',
];

const mockStore = configureMockStore([thunk]);

const experimentId = fake.EXPERIMENT_ID;
const defaultProps = {
  experimentId,
  allSteps: steps,
  currentStep: 0,
  completedSteps: [],
};

const StatusIndicatorFactory = createTestComponentFactory(StatusIndicator, defaultProps);

const renderStatusIndicator = (store, newState = {}) => {
  render(
    <Provider store={store}>
      {StatusIndicatorFactory(newState)}
    </Provider>,
  );
};

const openDropdown = () => fireEvent.mouseOver(screen.getByText(/Status/i));

const emptyState = {
  backendStatus: {
    [experimentId]: {
      ...initialBackendStatusState,
      status: {
        pipeline: {},
      },
    },
  },
};

const generateState = (pipelineState = {}, fetchingState = {}) => ({
  backendStatus: {
    ...emptyState.backendStatus,
    [experimentId]: {
      ...emptyState.backendStatus[experimentId],
      ...fetchingState,
      status: {
        pipeline: {
          startDate: '2022-01-01T01:01:01.000Z',
          stopDate: '2022-01-01T01:01:01.000Z',
          status: pipelineStatus.RUNNING,
          error: false,
          completedSteps: steps.slice(0, 2),
          ...pipelineState,
        },
      },
    },
  },

});

describe('StatusIndicator', () => {
  it('Should render even if backend status is not loaded', () => {
    renderStatusIndicator(mockStore(emptyState));

    expect(screen.getByText(/Status/i)).toBeInTheDocument();
  });

  it('Should not show step information if not hovered', () => {
    renderStatusIndicator(mockStore(generateState()));

    expect(screen.queryByText(/The analysis launched/i)).toBeNull();
  });

  it('Should show step information if hovered', async () => {
    renderStatusIndicator(mockStore(generateState()));

    openDropdown();

    await waitFor(() => {
      expect(screen.getByText(/The analysis launched/i)).toBeInTheDocument();
    });
  });

  it('Shows correctly for not created status', async () => {
    const notCreatedState = { status: pipelineStatus.NOT_CREATED };

    renderStatusIndicator(mockStore(generateState(notCreatedState)));

    openDropdown();

    expect(screen.getByText(/to be started/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/You have never submitted your analysis to data processing./i)).toBeInTheDocument();
    });
  });

  it('Shows correctly for running status', async () => {
    const runningState = { status: pipelineStatus.RUNNING };

    renderStatusIndicator(mockStore(generateState(runningState)));

    openDropdown();

    expect(screen.getByText(/running/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/is now in progress. This will take a few minutes./i)).toBeInTheDocument();
    });
  });

  it('Shows correctly for failed status', async () => {
    const failedState = { status: pipelineStatus.FAILED, completedSteps: steps.slice(0, 3) };

    renderStatusIndicator(
      mockStore(generateState(failedState)),
      { completedSteps: failedState.completedSteps, allSteps: steps },
    );

    openDropdown();

    expect(screen.getByText(/failed/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/and failed/i)).toBeInTheDocument();
    });
  });

  it('Shows correctly for aborted status', async () => {
    const abortedState = { status: pipelineStatus.ABORTED };

    renderStatusIndicator(mockStore(generateState(abortedState)));

    openDropdown();

    expect(screen.getByText(/stopped/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/and was stopped/i)).toBeInTheDocument();
    });
  });

  it('Shows correctly for finished status', async () => {
    const finishedState = { status: pipelineStatus.SUCCEEDED };

    renderStatusIndicator(mockStore(generateState(finishedState)));

    openDropdown();

    expect(screen.getByRole('img', { name: 'check-circle' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/and finished/i)).toBeInTheDocument();
    });
  });

  it('Shows loading text when status is loading', async () => {
    const fetchingState = { loading: true };

    renderStatusIndicator(mockStore(generateState({}, fetchingState)));

    openDropdown();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Loading run status/i)).toBeInTheDocument();
    });
  });

  it('Shows error text when there is an error', async () => {
    const fetchErrorState = { loading: false, error: true };

    renderStatusIndicator(mockStore(generateState({}, fetchErrorState)));

    openDropdown();

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Failed loading run status./i)).toBeInTheDocument();
    });
  });
});
