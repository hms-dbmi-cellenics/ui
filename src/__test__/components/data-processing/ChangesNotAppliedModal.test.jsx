import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';

import { getBackendStatus } from 'redux/selectors';
import experimentSettingsInitialState, { metaInitialState } from 'redux/reducers/experimentSettings/initialState';
import ChangesNotAppliedModal from 'components/data-processing/ChangesNotAppliedModal';

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

jest.mock('redux/selectors');

getBackendStatus.mockImplementation(() => () => ({
  status: {
    gem2s: {
      paramsHash: 'mock-params-hash',
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

describe('ChangesNotAppliedModal', () => {
  it('Displays correctly', () => {
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

  it('Fires the correct action for Run button', () => {
    const mockRunQC = jest.fn();

    render(
      <Provider store={mockStore(withChangesState)}>
        <ChangesNotAppliedModal onRunQC={() => mockRunQC()} />
      </Provider>,
    );

    userEvent.click(screen.getByText('Run'));
    expect(mockRunQC).toHaveBeenCalled();
  });

  it('Fires the correct action for Discard button', () => {
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
    const mockOnCloseModal = jest.fn();

    render(
      <Provider store={mockStore(withChangesState)}>
        <ChangesNotAppliedModal onCloseModal={() => mockOnCloseModal()} />
      </Provider>,
    );

    userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockOnCloseModal).toHaveBeenCalled();
  });
});
