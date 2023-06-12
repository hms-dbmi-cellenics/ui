import _ from 'lodash';
import React from 'react';
import {
  screen, render, act, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { getBackendStatus } from 'redux/selectors';
import experimentSettingsInitialState, { metaInitialState } from 'redux/reducers/experimentSettings/initialState';
import ChangesNotAppliedModal from 'components/data-processing/ChangesNotAppliedModal';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';

jest.mock('redux/selectors');

jest.mock('utils/qcSteps', () => ({
  getUserFriendlyQCStepName: jest.fn().mockImplementation((step) => {
    switch (step) {
      case 'step-1':
        return 'Step 1';
      case 'step-2':
        return 'Step 2';
      default:
        return '';
    }
  }),
}));

const mockNavigateTo = jest.fn();
jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

getBackendStatus.mockImplementation(() => () => ({
  status: {
    gem2s: {
      shouldRerun: true,
    },
  },
}));

const mockStore = configureMockStore([thunk]);

const changedSettings = ['step-1', 'step-2'];
const experimentId = 'experiment-id';

const noChangesState = {
  experimentSettings: {
    ...experimentSettingsInitialState,
    info: {
      ...experimentSettingsInitialState.info,
      experimentName: 'expName',
      pipelineVersion: 1,
      experimentId,
    },
    processing: {
      ...experimentSettingsInitialState.processing,
      meta: {
        ...metaInitialState,
      },
    },
  },
};

const withChangesState = {
  ...noChangesState,
  experimentSettings: {
    ...noChangesState.experimentSettings,
    processing: {
      ...noChangesState.experimentSettings.processing,
      meta: {
        ...metaInitialState,
        changedQCFilters: new Set(changedSettings),
      },
    },
  },
};

enableFetchMocks();

const mockAPIResponses = generateDefaultMockAPIResponses(experimentId);
const urlMatcher = `/v2/access/${experimentId}/check?url=%2Fv2%2Fexperiments%2F${experimentId}%2Fqc&method=POST`;

describe('ChangesNotAppliedModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
  });

  it('Displays correctly', () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(true)),
    }));

    render(
      <Provider store={mockStore(withChangesState)}>
        <ChangesNotAppliedModal />
      </Provider>,
    );

    // There is a header
    expect(screen.getByText('Changes not applied')).toBeInTheDocument();

    // Information text
    expect(screen.getByText('Your changes to the settings of these filters are not yet applied:')).toBeInTheDocument();

    // Run button
    expect(screen.getByText('Run')).toBeInTheDocument();

    // Discard button
    expect(screen.getByText('Discard')).toBeInTheDocument();

    // Close button
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('Shows the correct list of changed QC filters', () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(true)),
    }));

    render(
      <Provider store={mockStore(withChangesState)}>
        <ChangesNotAppliedModal />
      </Provider>,
    );

    // Step 1
    expect(screen.getByText('Step 1')).toBeInTheDocument();

    // Step 2
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('Does not display list of QC filters if there are no changed qc filters', () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(true)),
    }));

    render(
      <Provider store={mockStore(noChangesState)}>
        <ChangesNotAppliedModal />
      </Provider>,
    );

    // It shouldn't display Step 1
    expect(screen.queryByText('Step 1')).toBeNull();

    // It shouldn't display Step 2
    expect(screen.queryByText('Step 2')).toBeNull();
  });

  it('Fires the correct action for Run button', async () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(true)),
    }));

    const mockRunQC = jest.fn();

    render(
      <Provider store={mockStore(withChangesState)}>
        <ChangesNotAppliedModal onRunQC={() => mockRunQC()} />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Run')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Run'));
    expect(mockRunQC).toHaveBeenCalled();
  });

  it('Fires the correct action for Discard button', () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(true)),
    }));
    const mockOnDiscardChanges = jest.fn();

    render(
      <Provider store={mockStore(withChangesState)}>
        <ChangesNotAppliedModal onDiscardChanges={() => mockOnDiscardChanges()} />
      </Provider>,
    );

    userEvent.click(screen.getByText('Discard'));
    expect(mockOnDiscardChanges).toHaveBeenCalled();
  });

  it('Fires the correct action when closed', () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(true)),
    }));
    const mockOnCloseModal = jest.fn();

    render(
      <Provider store={mockStore(withChangesState)}>
        <ChangesNotAppliedModal onCloseModal={() => mockOnCloseModal()} />
      </Provider>,
    );

    userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockOnCloseModal).toHaveBeenCalled();
  });

  it('Shows the QCRerunDisabledModal if the pipelineVersion is too old', async () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(true)),
    }));
    const mockRunQC = jest.fn();

    const oldPipelineState = _.cloneDeep(withChangesState);
    oldPipelineState.experimentSettings.info.pipelineVersion = 0;

    const onCloseModalMock = jest.fn();
    render(
      <Provider store={mockStore(oldPipelineState)}>
        <ChangesNotAppliedModal onRunQC={() => mockRunQC()} onCloseModal={onCloseModalMock} />
      </Provider>,
    );

    userEvent.click(screen.getByText('Run'));

    expect(mockRunQC).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/Due to a recent update, re-running the pipeline will initiate the run from the beginning/)).toBeInTheDocument();
    });

    // When clicking clone project, the modal disappears and navigateTo is called
    await act(async () => {
      userEvent.click(screen.getAllByText(/Clone Project/)[1]);
    });

    expect(onCloseModalMock).toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalled();

    expect(fetchMock.mock.calls).toMatchSnapshot();
  });

  it('Shows the QCRerunDisabledModal if the user isnt authorized to rerun qc', async () => {
    fetchMock.mockIf(/.*/, mockAPI({
      ...mockAPIResponses,
      [urlMatcher]: () => Promise.resolve(JSON.stringify(false)),
    }));
    const mockRunQC = jest.fn();

    const oldPipelineState = _.cloneDeep(withChangesState);
    oldPipelineState.experimentSettings.info.pipelineVersion = 0;

    const onCloseModalMock = jest.fn();
    render(
      <Provider store={mockStore(oldPipelineState)}>
        <ChangesNotAppliedModal onRunQC={() => mockRunQC()} onCloseModal={onCloseModalMock} />
      </Provider>,
    );

    userEvent.click(screen.getByText('Run'));

    expect(mockRunQC).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText(/Your account is not authorized to run data processing on this project. You have 2 options:/),
      ).toBeInTheDocument();
    });

    // When clicking clone project, the modal disappears and navigateTo is called
    await act(async () => {
      userEvent.click(screen.getAllByText(/Clone Project/)[1]);
    });

    expect(onCloseModalMock).toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalled();

    expect(fetchMock.mock.calls).toMatchSnapshot();
  });
});
