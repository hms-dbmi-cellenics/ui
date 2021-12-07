import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'antd';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import configureMockstore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockSamples from '__test__/test-utils/mockData/mockSamples';
import fake from '__test__/test-utils/constants';
import DataManagementIntercept from 'components/data-management/DataManagementIntercept';
import AppRouteProvider, { useAppRouter } from '../../utils/AppRouteProvider';
import DataProcessingIntercept from '../../components/data-processing/DataProcessingIntercept';
import initialExperimentSettingsState, { metaInitialState } from '../../redux/reducers/experimentSettings/initialState';

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('../../components/data-processing/DataProcessingIntercept',
  () => jest.fn(() => <>Data Processing Intercept</>));
jest.mock('../../components/data-management/DataManagementIntercept',
  () => jest.fn(() => <>Data Management Intercept</>));
const buttonText = 'Go';

const mockRouter = {
  pathname: '/data-processing',
  push: jest.fn(),
};

useRouter.mockReturnValue(mockRouter);

const mockStore = configureMockstore([thunk]);

const changedFilters = ['filter-1', 'filter-2'];
const testPath = '/test/path';
const activeProjectUuid = 'mock-project-uuid-random-characters';

const experimentInformation = {
  projects: {
    meta: {
      activeProjectUuid,
    },
    [activeProjectUuid]: {
      experiments: [fake.EXPERIMENT_ID],
      samples: [`${fake.SAMPLE_ID}-0`],
      metadataKeys: [],
    },
  },
  experiments: {
    [fake.EXPERIMENT_ID]: {
      meta: {
        organism: 'homoSapiens',
        type: '10x',
      },
    },
  },
  samples: mockSamples(),
  backendStatus: {
    [fake.EXPERIMENT_ID]: {
      status: {
        gem2s: {
          status: 'SUCCEEDED',
          paramsHash: 'paramsHash123',
        },
        pipeline: {
          status: 'SUCCEEDED',
        },
      },
    },
  },
};
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
  ...experimentInformation,
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
  ...experimentInformation,
};

const TestComponent = (props) => {
  // eslint-disable-next-line react/prop-types
  const { path, refreshPage = false } = props;
  const navigateTo = useAppRouter();

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
      </Provider>,
    );

    userEvent.click(screen.getByText(buttonText));

    expect(DataProcessingIntercept).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalled();

    expect(mockRouter.push).toHaveBeenCalledWith(testPath);
  });

  it('Displays DataManagementIntercept if the experiment needs reprocessing again', () => {
    useRouter.mockReturnValue({ pathname: '/data-management', push: jest.fn() });

    render(
      <Provider store={mockStore(noFilterChanged)}>
        <AppRouteProvider>
          <TestComponent path='/data-management' />
        </AppRouteProvider>
      </Provider>,
    );
    userEvent.click(screen.getByText(buttonText));
    expect(DataManagementIntercept).toHaveBeenCalled();
  });

  it('Does not display DataManagementIntercept if the project does not need reprocessing', () => {
    const noProcessingState = {
      ...noFilterChanged,
      backendStatus: {
        ...experimentInformation.backendStatus,
        [fake.EXPERIMENT_ID]: {
          status: {
            gem2s: {
              paramsHash: '2dad18d1ffb798f9553bf40898e7e3ff6142c217',
              status: 'SUCCEEDED',
            },
          },
        },
      },
    };
    useRouter.mockReturnValue({ pathname: '/data-management', push: jest.fn() });

    render(
      <Provider store={mockStore(noProcessingState)}>
        <AppRouteProvider>
          <TestComponent path='/data-management' />
        </AppRouteProvider>
      </Provider>,
    );
    userEvent.click(screen.getByText(buttonText));
    expect(DataManagementIntercept).not.toHaveBeenCalled();
  });
});
