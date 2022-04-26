import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import fake from '__test__/test-utils/constants';
import FrequencyIndex from 'pages/experiments/[experimentId]/plots-and-tables/frequency/index';
import { act } from 'react-dom/test-utils';
import _ from 'lodash';
import mockAPI, {
  statusResponse,
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from 'redux/actionTypes/experimentSettings';
import { makeStore } from 'redux/store';
import { plotNames } from 'utils/constants';
import ExportAsCSV from 'components/plots/ExportAsCSV';

jest.mock('components/plots/ExportAsCSV', () => jest.fn(() => (<></>)));
jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

describe('Frequency plots and tables index page', () => {
  let storeState = null;
  const plotUuid = 'frequencyPlotMain';

  // simulating intial load of plot
  const customAPIResponses = {
    [`/plots-tables/${plotUuid}`]: () => statusResponse(404, 'Not Found'),
  };
  const mockApiResponses = _.merge(
    generateDefaultMockAPIResponses(fake.EXPERIMENT_ID), customAPIResponses,
  );

  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockApiResponses));
    storeState = makeStore();

    // getting the experiment info which is otherwise done by the SSR
    await storeState.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });
  });

  const renderFrequencyIndex = async () => {
    await act(async () => render(
      <Provider store={storeState}>
        <FrequencyIndex
          experimentId={fake.EXPERIMENT_ID}
        />
      </Provider>,
    ));
  };

  it('Renders all control panels', async () => {
    await renderFrequencyIndex();
    expect(screen.getByText(new RegExp(plotNames.FREQUENCY_PLOT, 'i'))).toBeInTheDocument();

    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Plot type/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();

    // vega should appear
    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();

    // csv data should be passed correctly
    expect(ExportAsCSV.mock.calls.slice(-1)[0]).toMatchSnapshot();
  });
});
