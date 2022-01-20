import React from 'react';
import { screen, render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import Auth from '@aws-amplify/auth';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { useRouter } from 'next/router';

import ContentWrapper from 'components/ContentWrapper';
import AppRouteProvider from 'utils/AppRouteProvider';

import { getBackendStatus } from 'redux/selectors';
import { loadProjects, setActiveProject } from 'redux/actions/projects';
import { loadExperiments } from 'redux/actions/experiments';
import { updateExperimentInfo } from 'redux/actions/experimentSettings';

import { makeStore } from 'redux/store';

import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

import fake from '__test__/test-utils/constants';

jest.mock('redux/selectors');

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn().mockImplementation(async () => true),
  federatedSignIn: jest.fn(),
}));

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const projectUuid = fake.PROJECT_ID;

const experimentName = 'test experiment';
const experimentData = {
  experimentId,
  experimentName,
};

const mockAPIResponses = generateDefaultMockAPIResponses(experimentId, projectUuid);

let store = null;

const renderContentWrapper = async (expId, expData) => {
  let result = {};

  await act(async () => {
    const output = render(
      <Provider store={store}>
        <AppRouteProvider>
          <ContentWrapper routeExperimentId={expId} experimentData={expData}>
            <></>
          </ContentWrapper>
        </AppRouteProvider>
      </Provider>,
    );

    result = output;
  });

  return result;
};

describe('ContentWrapper', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    useRouter.mockImplementation(() => ({
      pathname: `/experiments/${experimentId}/data-exploration`,
    }));

    store = makeStore();

    await store.dispatch(loadProjects());
    await store.dispatch(loadExperiments(projectUuid));
    await store.dispatch(setActiveProject(projectUuid));
    await store.dispatch(updateExperimentInfo({ experimentId, experimentName, sampleIds: [] }));
  });

  it('renders correctly', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: {},
    }));

    await renderContentWrapper(experimentId, experimentData);

    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText(experimentName)).toBeInTheDocument();
    expect(screen.getByText('Data Processing')).toBeInTheDocument();
    expect(screen.getByText('Data Exploration')).toBeInTheDocument();
    expect(screen.getByText('Plots and Tables')).toBeInTheDocument();
  });

  it('links are disabled if there is no experimentId', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: null,
    }));

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
    const mockBackendStatus = {
      loading: false,
      error: false,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
          paramsHash: false,
        },
      },
    };

    getBackendStatus.mockImplementation(() => () => mockBackendStatus);

    await renderContentWrapper();

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

    getBackendStatus.mockImplementation(() => () => ({
      loading: false,
      error: false,
      status: null,
    }));

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
});
