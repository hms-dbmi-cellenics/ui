import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'antd';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';
import { projects } from '__test__/test-utils/mockData';

import AppRouteProvider, { useAppRouter } from 'utils/AppRouteProvider';
import DataProcessingIntercept from 'components/data-processing/DataProcessingIntercept';

import addChangedQCFilter from 'redux/actions/experimentSettings/processingConfig/addChangedQCFilter';
import { updateExperimentInfo } from 'redux/actions/experimentSettings';
import { loadProjects, updateProject } from 'redux/actions/projects';
import { loadExperiments, updateExperiment } from 'redux/actions/experiments';

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('components/data-processing/DataProcessingIntercept',
  () => jest.fn(() => <>Data Processing Intercept</>));

jest.mock('redux/actions/experimentSettings/updateExperimentInfo');
jest.mock('redux/actions/projects/updateProject');
jest.mock('redux/actions/experiments/updateExperiment');

updateExperimentInfo.mockImplementation(() => ({ type: 'MOCK_ACTION ' }));
updateProject.mockImplementation(() => ({ type: 'MOCK_ACTION ' }));
updateExperiment.mockImplementation(() => ({ type: 'MOCK_ACTION ' }));

enableFetchMocks();

const projectUuid = projects[0].uuid;
const defaultResponses = generateDefaultMockAPIResponses(fake.EXPERIMENT_ID, projectUuid);

const buttonText = 'Go';

const mockRouter = {
  pathname: '/data-processing',
  push: jest.fn(),
};

useRouter.mockReturnValue(mockRouter);
let storeState = null;

const changedFilters = ['filter-1', 'filter-2'];
const testPath = '/test/path';

const TestComponent = (props) => {
  // eslint-disable-next-line react/prop-types
  const { path, refreshPage = false } = props;
  const { navigateTo } = useAppRouter();

  return (
    <div>
      <Button onClick={() => navigateTo(path, refreshPage)}>
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
          <TestComponent path={testPath} />
        </AppRouteProvider>
      </Provider>,
    );

    userEvent.click(screen.getByText(buttonText));

    expect(mockRouter.push).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith(testPath);
  });

  it('Loads projects and experiment info when navigating from DataManagement', async () => {
    await storeState.dispatch(loadProjects());
    await storeState.dispatch(loadExperiments(projectUuid));

    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent path='/data-exploration' />
        </AppRouteProvider>
      </Provider>,
    );

    mockRouter.pathname = '/data-management';

    userEvent.click(screen.getByText(buttonText));

    expect(updateExperimentInfo).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateExperiment).toHaveBeenCalledTimes(1);

    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('Displays DataProcessingIntercept correctly', () => {
    storeState.dispatch(addChangedQCFilter(changedFilters[0]));

    render(
      <Provider store={storeState}>
        <AppRouteProvider>
          <TestComponent path='/data-exploration' />
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
          <TestComponent path={testPath} />
        </AppRouteProvider>
        ,
      </Provider>,
    );

    userEvent.click(screen.getByText(buttonText));

    expect(DataProcessingIntercept).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalled();

    expect(mockRouter.push).toHaveBeenCalledWith(testPath);
  });
});
