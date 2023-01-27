import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import _ from 'lodash';
import { Provider } from 'react-redux';

import mockAPI, { generateDefaultMockAPIResponses, statusResponse } from '__test__/test-utils/mockAPI';
import { experiments } from '__test__/test-utils/mockData';

import DraggableBodyRow from 'components/data-management/DraggableBodyRow';
import SamplesTable from 'components/data-management/SamplesTable';
import { makeStore } from 'redux/store';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import { loadExperiments, setActiveExperiment } from 'redux/actions/experiments';
import loadDeploymentInfo from 'redux/actions/networkResources/loadDeploymentInfo';
import { loadSamples } from 'redux/actions/samples';

import { loadUser } from 'redux/actions/user';

jest.mock(
  'components/data-management/DraggableBodyRow',
  () => jest.fn(jest.requireActual('components/data-management/DraggableBodyRow')),
);

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn(() => Promise.resolve({
    attributes: {
      name: 'mockUserName',
      'custom:agreed_terms': 'true',
    },
  })),
  federatedSignIn: jest.fn(),
}));

const defaultProps = {
  height: 100,
};

const samplesTableFactory = createTestComponentFactory(SamplesTable, defaultProps);
const renderSamplesTable = async (store) => {
  let renderComponents;

  await act(async () => {
    renderComponents = render(
      <Provider store={store}>
        {samplesTableFactory()}
      </Provider>,
    );
  });

  return renderComponents;
};

enableFetchMocks();

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);

const experimentWithSamplesId = experimentWithSamples.id;

// Mocking samples update / delete routes
const customResponses = {
  [`experiments/${experimentWithSamplesId}/samples/position`]: () => statusResponse(200, 'OK'),
};

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentWithSamplesId),
  customResponses,
);

let storeState = null;

describe('Samples table', () => {
  beforeEach(async () => {
    fetchMock.mockClear();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadUser());
    await storeState.dispatch(loadExperiments());

    // Loading experiment is usually called in Data Management, so we have to load them manually
    await storeState.dispatch(loadSamples(experimentWithSamplesId));

    // Defaults to project with samples
    await storeState.dispatch(setActiveExperiment(experimentWithSamplesId));
    await storeState.dispatch(loadDeploymentInfo({ environment: 'test' }));
  });

  it('Reorder samples send correct request in api v2', async () => {
    await renderSamplesTable(storeState);

    const { moveRow } = DraggableBodyRow.mock.calls[0][0];

    await act(async () => {
      await moveRow(0, 5);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${experimentWithSamples.id}/samples/position`,
      {
        method: 'PUT',
        headers: expect.anything(),
        body: '{"oldPosition":0,"newPosition":5}',
      },
    );
  });
});
