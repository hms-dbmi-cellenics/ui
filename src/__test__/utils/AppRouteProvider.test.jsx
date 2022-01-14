import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'antd';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import configureMockstore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AppRouteProvider, { useAppRouter } from '../../utils/AppRouteProvider';
import DataProcessingIntercept from '../../components/data-processing/DataProcessingIntercept';

import initialExperimentSettingsState, { metaInitialState } from '../../redux/reducers/experimentSettings/initialState';

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('../../components/data-processing/DataProcessingIntercept',
  () => jest.fn(() => <>Data Processing Intercept</>));

const buttonText = 'Go';

const mockRouter = {
  pathname: '/data-processing',
  push: jest.fn(),
};

useRouter.mockReturnValue(mockRouter);

const mockStore = configureMockstore([thunk]);

const changedFilters = ['filter-1', 'filter-2'];
const testPath = '/test/path';

const noFilterChanged = {
  experimentSettings: {
    ...initialExperimentSettingsState,
    processing: {
      ...initialExperimentSettingsState.processing,
      meta: {
        ...metaInitialState,
      },
    },
  },
};

const withFiltersChanged = {
  experimentSettings: {
    ...noFilterChanged.experimentSettings,
    processing: {
      ...noFilterChanged.experimentSettings.processing,
      meta: {
        ...noFilterChanged.experimentSettings.processing.meta,
        changedQCFilters: new Set(changedFilters),
      },
    },
  },
};

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

describe('RouteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders its children correctly', () => {
    render(
      <Provider store={mockStore(noFilterChanged)}>
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
      <Provider store={mockStore(noFilterChanged)}>
        <AppRouteProvider>
          <TestComponent path={testPath} />
        </AppRouteProvider>
      </Provider>,
    );

    userEvent.click(screen.getByText(buttonText));

    expect(mockRouter.push).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith(testPath);
  });

  it('Displays DataProcessingIntercept correctly', () => {
    render(
      <Provider store={mockStore(withFiltersChanged)}>
        <AppRouteProvider>
          <TestComponent path='/data-exploration' />
        </AppRouteProvider>
      </Provider>,
    );

    mockRouter.initalPath = '/data-processing';

    userEvent.click(screen.getByText(buttonText));

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(DataProcessingIntercept).toHaveBeenCalled();

    expect(screen.getByText('Data Processing Intercept')).toBeInTheDocument();
  });

  it('Does not display DataProcessingIntercept if there is no changedQCFilters', () => {
    render(
      <Provider store={mockStore(noFilterChanged)}>
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
