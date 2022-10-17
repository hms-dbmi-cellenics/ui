import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

import { technologies } from 'utils/upload/fileUploadSpecifications';

import experimentsInitialState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import samplesInitialState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import SampleOptions from 'components/data-management/SampleOptions';

import bulkUpdateSampleOptions from 'redux/actions/samples/bulkUpdateSampleOptions';

import _ from 'lodash';
import userEvent from '@testing-library/user-event';

jest.mock('redux/actions/samples/bulkUpdateSampleOptions', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));

const experimentId10x = 'experimentId10x';
const experimentIdRhapsody = 'experimentIdRhapsody';

const sampleId10x = '10xSampleId';
const sampleIdRhapsody = 'rhapsodySampleId';

const sample10x = {
  ...sampleTemplate,
  name: '10x sample',
  experimentId: experimentId10x,
  uuid: sampleId10x,
  type: technologies['10x'],
};

const sampleRhapsody = {
  ...sampleTemplate,
  name: 'sample experiment',
  experimentId: experimentIdRhapsody,
  uuid: sampleIdRhapsody,
  type: technologies.rhapsody,
};

const platformState = {
  experiments: {
    ...experimentsInitialState,
    [experimentId10x]: {
      ...experimentTemplate,
      id: experimentId10x,
      name: '10x Experiment',
      sampleIds: [sampleId10x],
    },
    [experimentIdRhapsody]: {
      ...experimentTemplate,
      id: experimentIdRhapsody,
      name: 'Rhapsody Experiment',
      sampleIds: [sampleIdRhapsody],
      options: {
        includeAbSeq: false,
      },
    },
    ids: [experimentId10x, experimentIdRhapsody],
  },
  samples: {
    ...samplesInitialState,
    [sampleIdRhapsody]: sampleRhapsody,
    [sampleId10x]: sample10x,
  },
};

const mockStore = configureMockStore([thunk]);

describe('SampleOptions', () => {
  it('Should not display anything for sample type 10x', () => {
    const show10xState = _.merge({}, platformState, {
      experiments: {
        meta: {
          activeExperimentId: experimentId10x,
        },
      },
    });

    render(
      <Provider store={mockStore(show10xState)}>
        <SampleOptions />
      </Provider>,
    );

    expect(screen.queryByText('Project Options')).toBeNull();
  });

  it('Should display the correct options if sample type is Rhapsody', async () => {
    const showRhapsodyState = _.merge({}, platformState, {
      experiments: {
        meta: {
          activeExperimentId: experimentIdRhapsody,
        },
      },
    });

    render(
      <Provider store={mockStore(showRhapsodyState)}>
        <SampleOptions />
      </Provider>,
    );

    // Should show the project options heading
    expect(screen.getByText('Project Options')).toBeInTheDocument();

    // There should be the option "include AbSeq data"
    expect(screen.getByText('Include AbSeq data')).toBeInTheDocument();

    // Information about the AbSeq option should be available on page
    const tooltip = screen.getByLabelText('question-circle');
    expect(tooltip).toBeInTheDocument();

    userEvent.hover(tooltip);

    await waitFor(() => {
      expect(screen.getByText(/AbSeq data is filtered out by default/i)).toBeInTheDocument();
    });

    // Checkbox should be clickable and dispatch action
    userEvent.click(screen.getByText('Include AbSeq data'));
    expect(bulkUpdateSampleOptions).toHaveBeenCalledTimes(1);
  });
});
