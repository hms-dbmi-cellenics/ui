import React from 'react';
import { screen, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import initialExperimentSettingsState, { metaInitialState } from 'redux/reducers/experimentSettings/initialState';
import DataProcessingIntercept from '../../../components/data-processing/DataProcessingIntercept';

import ChangesNotAppliedModal from '../../../components/data-processing/ChangesNotAppliedModal';

const mockStore = configureStore([thunk]);

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

jest.mock('../../../components/data-processing/ChangesNotAppliedModal', () => jest.fn(() => <>Changes Not Applied</>));

const changesState = {
  experimentSettings: {
    ...initialExperimentSettingsState,
    info: {
      ...initialExperimentSettingsState.info,
      experimenId: 'sample-experiment-id',
    },
    processing: {
      ...initialExperimentSettingsState.processing,
      meta: {
        ...metaInitialState,
        changedQCFilters: ['step-1', 'step-2'],
      },
    },
  },
};

describe('DataProcessingIntercept', () => {
  it('Renders its content properly', () => {
    render(
      <Provider store={mockStore(changesState)}>
        <DataProcessingIntercept />
      </Provider>,
    );

    // Test that the Changes Not Saved Modal is rendered
    expect(ChangesNotAppliedModal).toHaveBeenCalled();
    expect(screen.getByText('Changes Not Applied')).toBeInTheDocument();
  });
});
