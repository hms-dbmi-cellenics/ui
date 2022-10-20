import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

import { sampleTech } from 'utils/constants';

import experimentsInitialState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import samplesInitialState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import SamplesOptions from 'components/data-management/SamplesOptions';

import updateSamplesOptions from 'redux/actions/experiments/updateSamplesOptions';

import _ from 'lodash';
import userEvent from '@testing-library/user-event';

jest.mock('redux/actions/experiments/updateSamplesOptions', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));

const experimentId10x = 'experimentId10x';
const experimentIdRhapsody = 'experimentIdRhapsody';

const sampleId10x = '10xSampleId';
const sampleIdRhapsody = 'rhapsodySampleId';

const sample10x = {
  ...sampleTemplate,
  name: '10x sample',
  experimentId: experimentId10x,
  uuid: sampleId10x,
  type: sampleTech['10X'],
};

const sampleRhapsody = {
  ...sampleTemplate,
  name: 'sample experiment',
  experimentId: experimentIdRhapsody,
  uuid: sampleIdRhapsody,
  type: sampleTech.RHAPSODY,
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

describe('10X sample options', () => {
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
        <SamplesOptions />
      </Provider>,
    );

    expect(screen.queryByText('Options')).toBeNull();
  });
});

describe('Rhapsody sample options', () => {
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
        <SamplesOptions />
      </Provider>,
    );

    // Should show the options heading
    expect(screen.getByText('Options')).toBeInTheDocument();

    // There should be the option "include AbSeq data"
    expect(screen.getByText('Include AbSeq data')).toBeInTheDocument();

    // Information about the AbSeq option should be available on page
    const tooltip = screen.getByLabelText('question-circle');
    expect(tooltip).toBeInTheDocument();

    userEvent.hover(tooltip);

    await waitFor(() => {
      expect(screen.getByText(/AbSeq data is filtered out by default/i)).toBeInTheDocument();
    });
  });

  it('Include abseq checkbox should work properly', () => {
    const showRhapsodyState = _.merge({}, platformState, {
      experiments: {
        meta: {
          activeExperimentId: experimentIdRhapsody,
        },
      },
    });

    render(
      <Provider store={mockStore(showRhapsodyState)}>
        <SamplesOptions />
      </Provider>,
    );

    // Checkbox should be clickable and dispatch action
    userEvent.click(screen.getByText('Include AbSeq data'));
    expect(updateSamplesOptions).toHaveBeenCalledTimes(1);
  });
});
