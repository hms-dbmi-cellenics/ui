import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'antd';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import { modules } from 'utils/constants';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';

import AppRouteProvider, { useAppRouter, PATHS } from 'utils/AppRouteProvider';
import DataProcessingIntercept from 'components/data-processing/DataProcessingIntercept';

import addChangedQCFilter from 'redux/actions/experimentSettings/processingConfig/addChangedQCFilter';
import {
  updateExperiment, switchExperiment, setActiveExperiment,
} from 'redux/actions/experiments';

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('components/data-processing/DataProcessingIntercept',
  () => jest.fn(() => <>Data Processing Intercept</>));
jest.mock('redux/actions/experiments/switchExperiment');
jest.mock('redux/actions/experiments/updateExperiment');
jest.mock('redux/actions/experiments/setActiveExperiment');

switchExperiment.mockImplementation(() => ({ type: 'MOCK_ACTION ' }));
updateExperiment.mockImplementation(() => ({ type: 'MOCK_ACTION ' }));
setActiveExperiment.mockImplementation(() => ({ type: 'MOCK_ACTION ' }));

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const defaultResponses = generateDefaultMockAPIResponses(experimentId);

const buttonText = 'Go';

const mockRouter = {
  pathname: '/data-processing',
  push: jest.fn(),
};

useRouter.mockReturnValue(mockRouter);
let storeState = null;

const changedFilters = ['filter-1', 'filter-2'];
const testModule = modules.DATA_EXPLORATION;
const expectedPath = PATHS[testModule].replace('[experimentId]', experimentId);

const TestComponent = (props) => {
  // eslint-disable-next-line react/prop-types
  const { module, params } = props;
  const { navigateTo } = useAppRouter();

  const testParams = {
    experimentId,
    ...params,
  };

  return (
    <div>
      <Button onClick={() => navigateTo(module, testParams)}>
        {buttonText}
      </Button>
    </div>
  );
};

describe('AppRouteProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeState = makeStore();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));
  });

  it('Renders its children correctly', () => {
    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent />
        </AppRouteProvider>
        ,
      </Provider>,
    );
    expect(screen.getByText(buttonText)).toBeInTheDocument();
  });

  it('Dispatches routes correctly', () => {
    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent module={testModule} />
        </AppRouteProvider>
      </Provider>,
    );

    userEvent.click(screen.getByText(buttonText));

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith(expectedPath);
  });

  it('Switch experiment when navigating from DataManagement', async () => {
    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent module={modules.DATA_PROCESSING} />
        </AppRouteProvider>
      </Provider>,
    );

    mockRouter.pathname = '/data-management';

    userEvent.click(screen.getByText(buttonText));

    expect(switchExperiment).toHaveBeenCalledTimes(1);

    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('Switch active experiment when navigating to DataManagement if an experiment is specified', async () => {
    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent module={modules.DATA_MANAGEMENT} />
        </AppRouteProvider>
      </Provider>,
    );

    mockRouter.pathname = '/data-processing';

    userEvent.click(screen.getByText(buttonText));

    await waitFor(() => {
      expect(setActiveExperiment).toHaveBeenCalledTimes(1);
    });

    expect(setActiveExperiment).toHaveBeenCalledWith(experimentId);
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('Displays DataProcessingIntercept correctly', () => {
    storeState.dispatch(addChangedQCFilter(changedFilters[0]));

    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent module={modules.DATA_EXPLORATION} />
        </AppRouteProvider>
      </Provider>,
    );

    mockRouter.pathname = '/data-processing';

    userEvent.click(screen.getByText(buttonText));

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(DataProcessingIntercept).toHaveBeenCalled();

    expect(screen.getByText('Data Processing Intercept')).toBeInTheDocument();
  });

  it('Does not display DataProcessingIntercept if there is no changedQCFilters', () => {
    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent module={testModule} />
        </AppRouteProvider>
        ,
      </Provider>,
    );

    userEvent.click(screen.getByText(buttonText));

    expect(DataProcessingIntercept).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalled();

    expect(mockRouter.push).toHaveBeenCalledWith(expectedPath);
  });
});
