import React from 'react';
import _ from 'lodash';

import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import '__test__/test-utils/mockWorkerBackend';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  statusResponse,
  delayedResponse,
} from '__test__/test-utils/mockAPI';

import createComponentFactory from '__test__/test-utils/componentFactory';
import { makeStore } from 'redux/store';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';

jest.mock('localforage');

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'dotPlotMain';

const customAPIResponses = {
  [`/plots-tables/${plotUuid}`]: () => statusResponse(404, 'Not Found'),
};

const defaultMockResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };
const dotPlotPageFactory = createComponentFactory(DotPlotPage, defaultProps);

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

  it('Shows a skeleton if config is not loaded', async () => {
    const noConfigResponse = _.merge(
      defaultMockResponses,
      {
        [`/plots-tables/${plotUuid}`]: () => delayedResponse({ status: 404, body: 'NotFound' }),
      },
    );

    fetchMock.mockIf(/.*/, noConfigResponse);

    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotPageFactory()}
        </Provider>,
      );
    });

    expect(screen.getByRole('list')).toHaveClass('ant-skeleton-paragraph');
  });
});
