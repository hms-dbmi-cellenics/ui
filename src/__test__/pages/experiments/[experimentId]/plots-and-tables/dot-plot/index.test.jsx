import React from 'react';
import _ from 'lodash';

import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import '__test__/test-utils/mockBackend';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  statusResponse,
} from '__test__/test-utils/mockAPI';

import { makeStore } from 'redux/store';

import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';

import { loadBackendStatus } from 'redux/actions/backendStatus';

jest.mock('localforage');

enableFetchMocks();

const customAPIResponses = {
  '/plots-tables/dotPlotMain': () => statusResponse(404, 'Not Found'),
};

const defaultMockResponses = _.merge(
  generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
  customAPIResponses,
);

const dotPlotPageFactory = (customProps = {}) => {
  const props = _.merge({
    experimentId: fake.EXPERIMENT_ID,
  }, customProps);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DotPlotPage {...props} />;
};

let storeState = null;

describe('Dot plot page', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultMockResponses));
    storeState = makeStore();

    storeState.dispatch(loadBackendStatus(fake.EXPERIMENT_ID));
  });

  it('Renders the plot page correctly', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotPageFactory()}
        </Provider>,
      );
    });

    // There is the text Dot plot show in the breadcrumbs
    expect(screen.getByText(/Dot plot/i)).toBeInTheDocument();

    // It has the required dropdown options
    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();

    // It shows the plot
    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  });
});
