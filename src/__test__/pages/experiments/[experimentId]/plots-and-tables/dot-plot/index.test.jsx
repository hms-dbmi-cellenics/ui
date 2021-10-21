import React from 'react';
import _ from 'lodash';

import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { makeStore } from 'redux/store';
import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';

import fake from '__test__/test-utils/constants';
import mockExperimentData from '__test__/test-utils/experimentData.mock';
import mockBackendStatus from '__test__/test-utils/backendStatus.mock';
import { loadBackendStatus } from 'redux/actions/backendStatus';

const cellSetsData = require('__test__/data/cell_sets.json');

enableFetchMocks();

jest.mock('localforage');

jest.mock('utils/socketConnection', () => {
  const mockEmit = jest.fn();
  const mockOn = jest.fn();

  return {
    __esModule: true,
    default: new Promise((resolve) => {
      resolve({ emit: mockEmit, on: mockOn, id: '5678' });
    }),
    mockEmit,
    mockOn,
  };
});

const dotPlotPageFactory = (customProps = {}) => {
  const props = _.merge({
    experimentId: fake.EXPERIMENT_ID,
  }, customProps);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DotPlotPage {...props} />;
};

let storeState;

const mockFetchAPI = (req) => {
  const path = req.url;

  // return SWR call in Header to get experiment data
  if (path.endsWith(fake.EXPERIMENT_ID)) {
    return Promise.resolve(new Response(
      JSON.stringify(mockExperimentData),
    ));
  }

  // return call to loadPlotConfig
  if (path.endsWith('/plots-tables/dotPlotMain')) {
    // Return 404 so plot uses default config
    return Promise.resolve({
      status: 404,
      body: 'Not Found',
    });
  }

  // return calls from loadCellSets
  if (path.endsWith('/cellSets')) {
    return Promise.resolve(new Response(
      JSON.stringify(cellSetsData),
    ));
  }

  // Return backend status
  if (path.endsWith('/backendStatus')) {
    return Promise.resolve(new Response(
      JSON.stringify(mockBackendStatus),
    ));
  }

  return Promise.resolve({
    status: 404,
    body: path,
  });
};

describe('Dot plot page', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(fake.API_ENDPOINT, mockFetchAPI);
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
