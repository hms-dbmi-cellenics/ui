import React from 'react';
import { screen, render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import Auth from '@aws-amplify/auth';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { useRouter } from 'next/router';
import preloadAll from 'jest-next-dynamic';

import ContentWrapper from 'components/ContentWrapper';
import AppRouteProvider from 'utils/AppRouteProvider';

import { makeStore } from 'redux/store';
import { getBackendStatus } from 'redux/selectors';

import { loadExperiments, setActiveExperiment } from 'redux/actions/experiments';

import { updateExperimentInfo } from 'redux/actions/experimentSettings';

import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';

import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

import { experiments } from '__test__/test-utils/mockData';

jest.mock('redux/selectors');
jest.mock('utils/socketConnection');
jest.mock('utils/data-management/calculateGem2sRerunStatus');

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => ({
    attributes: {
      'custom:agreed_terms': 'true',
    },
  })),
  federatedSignIn: jest.fn(),
}));

jest.mock('utils/socketConnection', () => ({
  __esModule: true,
  default: new Promise((resolve) => {
    resolve({
      emit: jest.fn(), on: jest.fn(), off: jest.fn(), id: '5678',
    });
  }),
}));

const chromeUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36';
const firefoxUA = '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:96.0) Gecko/20100101 Firefox/96.0"';

Object.defineProperty(navigator, 'userAgent', { value: chromeUA, writable: true });

enableFetchMocks();

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);

const sampleIds = experimentWithSamples.samplesOrder;

const experimentId = experimentWithSamples.id;

const experimentName = 'test experiment';
const experimentData = {
  experimentId,
  experimentName,
};

const mockAPIResponses = generateDefaultMockAPIResponses(experimentId);

let store = null;

const renderContentWrapper = async (expId, expData) => {
  let result = {};

  await act(async () => {
    const output = render(
      <Provider store={store}>
        <AppRouteProvider>
          <ContentWrapper routeExperimentId={expId} experimentData={expData}>
            <>Test</>
          </ContentWrapper>
        </AppRouteProvider>
      </Provider>,
    );

    result = output;
  });

  return result;
};

getBackendStatus.mockImplementation(() => () => ({
  loading: false,
  error: false,
  status: null,
}));

describe('ContentWrapper', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    useRouter.mockImplementation(() => ({
      pathname: '/data-management',
    }));

    store = makeStore();

    navigator.userAgent = chromeUA;

    calculateGem2sRerunStatus.mockImplementation(() => ({ rerun: true, reasons: [] }));

    await store.dispatch(loadExperiments());
    await store.dispatch(setActiveExperiment(experimentId));
    await store.dispatch(updateExperimentInfo({ experimentId, experimentName, sampleIds }));
  });

  afterEach(() => {
    calculateGem2sRerunStatus.mockRestore();
  });

  it('renders correctly', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: null,
    }));

    await renderContentWrapper(experimentId, experimentData);

    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText(experimentName)).toBeInTheDocument();
    expect(screen.getByText('Data Processing')).toBeInTheDocument();
    expect(screen.getByText('Data Exploration')).toBeInTheDocument();
    expect(screen.getByText('Plots and Tables')).toBeInTheDocument();
  });

  it('links are disabled if there is no experimentId', async () => {
    await renderContentWrapper();

    // Data Management is not disabled
    expect(screen.getByText('Data Management').closest('li')).toHaveAttribute('aria-disabled', 'false');

    // Data Processing link is disabled
    expect(screen.getByText('Data Processing').closest('li')).toHaveAttribute('aria-disabled', 'true');

    // Data Exploration link is disabled
    expect(screen.getByText('Data Exploration').closest('li')).toHaveAttribute('aria-disabled', 'true');

    // Plots and Tables link is disabled
    expect(screen.getByText('Plots and Tables').closest('li')).toHaveAttribute('aria-disabled', 'true');
  });

  it('Links are enabled if the selected project is processed', async () => {
    calculateGem2sRerunStatus.mockImplementationOnce(() => ({ rerun: false, reasons: [] }));

    const mockBackendStatus = {
      loading: false,
      error: false,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
          shouldRerun: false,
        },
      },
    };

    getBackendStatus.mockImplementation(() => () => mockBackendStatus);

    await renderContentWrapper(experimentId, experimentData);

    // Data Management is not disabled
    expect(screen.getByText('Data Management').closest('li')).toHaveAttribute('aria-disabled', 'false');

    // Data Processing link is not disabled
    expect(screen.getByText('Data Processing').closest('li')).toHaveAttribute('aria-disabled', 'false');

    // Data Exploration link is not disabled
    expect(screen.getByText('Data Exploration').closest('li')).toHaveAttribute('aria-disabled', 'false');

    // Plots and Tables link is not disabled
    expect(screen.getByText('Plots and Tables').closest('li')).toHaveAttribute('aria-disabled', 'false');
  });

  it('has the correct sider and layout style when opened / closed', async () => {
    const siderHasWidth = (container, expectedWidth) => {
      const div = container.firstChild;

      const [sidebar, content] = Array.from(div.children);

      const expandedComputedStyle = getComputedStyle(sidebar).getPropertyValue('width');
      expect(expandedComputedStyle).toEqual(expectedWidth);
      expect(content.getAttribute('style')).toMatch(`margin-left: ${expectedWidth}`);
    };

    const { container } = await renderContentWrapper();

    const expandedWidth = '210px';
    const collapsedWidth = '80px';

    // Click so the sidebar collapse
    userEvent.click(screen.getByLabelText('left'));

    siderHasWidth(container, collapsedWidth);

    // Click so the sidebar open
    userEvent.click(screen.getByLabelText('right'));

    siderHasWidth(container, expandedWidth);
  });

  // PROBLEMATIC
  it('View changes if there is a pipeline run underway', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: { pipeline: { status: 'RUNNING' } },
    }));

    await renderContentWrapper(experimentId, experimentData);

    expect(screen.getByText(/We're working on your project.../i)).toBeInTheDocument();
  });

  it('Redirects to login if the user is unauthenticated', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      [experimentId]: {
        loading: false,
        error: false,
        status: {},
      },
    }));

    Auth.currentAuthenticatedUser
      .mockImplementationOnce(
        async () => { throw new Error('user not signed in'); },
      );

    await renderContentWrapper(experimentId, experimentData);

    expect(screen.queryByText('Data Management')).not.toBeInTheDocument();
    expect(Auth.federatedSignIn).toHaveBeenCalled();
  });

  it('Shows browser banner if users are not using chrome', async () => {
    navigator.userAgent = firefoxUA;

    await renderContentWrapper(experimentId, experimentData);

    expect(screen.getByText(/Browser not supported/)).toBeInTheDocument();
  });

  it('Does not show browser banner if users are not using chrome', async () => {
    await renderContentWrapper(experimentId, experimentData);

    expect(screen.queryByText(/Browser not supported/)).not.toBeInTheDocument();
  });

  it('Shows preload if backend status is still loading', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: true,
      error: false,
      status: {},
    }));

    await renderContentWrapper(experimentId, experimentData);

    expect(screen.queryByTestId('preloadContent')).toBeInTheDocument();

    expect(screen.queryByText(/Test/)).not.toBeInTheDocument();
  });

  it('Shows browser banner if users are not using chrome', async () => {
    navigator.userAgent = firefoxUA;

    await renderContentWrapper(experimentId, experimentData);

    expect(screen.getByText(/Browser not supported/)).toBeInTheDocument();
  });

  it('Does not show browser banner if users are not using chrome', async () => {
    await renderContentWrapper(experimentId, experimentData);

    expect(screen.queryByText(/Browser not supported/)).not.toBeInTheDocument();
  });
});
