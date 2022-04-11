import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { screen, render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';

import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';

import { getFromApiExpectOK } from 'utils/getDataExpectOK';
import DownloadDataButton from 'components/data-management/DownloadDataButton';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import downloadFromUrl from 'utils/data-management/downloadFromUrl';

import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';
import initialSamplesState from 'redux/reducers/samples/initialState';
import initialExperimentsState from 'redux/reducers/experiments/initialState';
import initialExperimentSettingsState from 'redux/reducers/experimentSettings/initialState';
import { initialExperimentBackendStatus } from 'redux/reducers/backendStatus/initialState';

import { getBackendStatus } from 'redux/selectors';

jest.mock('redux/selectors');
jest.mock('utils/getDataExpectOK');
jest.mock('utils/pushNotificationMessage');
jest.mock('utils/data-management/downloadFromUrl');

const mockStore = configureMockStore([thunk]);
const projectName = 'Project 1';
const projectUuid = 'project-1-uuid';
const projectDescription = 'Some description';
const experimentId = 'my-experiment-🧬';
const sample1Uuid = 'sample-1';
const sample2Uuid = 'sample-2';

const noDataState = {
  projects: {
    ...initialProjectState,
    meta: {
      ...initialProjectState.meta,
      activeProjectUuid: projectUuid,
      loading: false,
    },
    ids: [projectUuid],
    [projectUuid]: {
      ...projectTemplate,
      uuid: projectUuid,
      name: projectName,
      description: projectDescription,
    },
  },
  experiments: {
    ...initialExperimentsState,
    ids: ['experiment-1'],
  },
  experimentSettings: {
    ...initialExperimentSettingsState,
  },
  samples: {
    ...initialSamplesState,
  },
};

const withDataState = {
  ...noDataState,
  projects: {
    ...noDataState.projects,
    [projectUuid]: {
      ...noDataState.projects[projectUuid],
      samples: [sample1Uuid, sample2Uuid],
      metadataKeys: ['metadata-1'],
      experiments: [experimentId],
    },
  },
  experimentSettings: {
    processing: {
      cellSizeDistribution: {
        [sample1Uuid]: {},
        [sample2Uuid]: {},
      },
    },
  },
};
describe('DownloadDataButton', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
  });

  const renderDownloadDataButton = async (state) => {
    const store = mockStore(state);
    await act(async () => {
      render(
        <Provider store={store}>
          <DownloadDataButton activeProjectUuid={projectUuid} />
        </Provider>,
      );
    });
  };

  const getMenuItems = async () => {
    const menu = await screen.getByText('Download');
    expect(menu).not.toBeDisabled();

    await act(async () => {
      userEvent.click(menu);
    });

    const options = await screen.getAllByRole('menuitem');
    return options;
  };

  it('should render the download data menu', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      ...initialExperimentBackendStatus,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
        },
      },
    }));

    await renderDownloadDataButton(withDataState);
    const options = await getMenuItems();
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Raw Seurat object (.rds)');
    expect(options[1]).toHaveTextContent('Processed Seurat object (.rds)');
    expect(options[2]).toHaveTextContent('Data Processing settings (.txt)');
    expect(options[0]).toHaveAttribute('aria-disabled', 'false');
    expect(options[1]).toHaveAttribute('aria-disabled', 'false');
    expect(options[2]).toHaveAttribute('aria-disabled', 'false');
  });

  it('Raw seurat object option is disabled if gem2s has not ran', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      ...initialExperimentBackendStatus,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'DEFINETELY NOT SUCCEEDED',
        },
      },
    }));

    const state = { ...withDataState };
    await renderDownloadDataButton(state);
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    expect(options[1]).toHaveAttribute('aria-disabled', 'false');
    expect(options[2]).toHaveAttribute('aria-disabled', 'false');
  });

  it('Processed Seurat object option is disabled if qc has not ran', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      ...initialExperimentBackendStatus,
      status: {
        pipeline: {
          status: 'DEFINETELY NOT SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
        },
      },
    }));

    const state = { ...withDataState };

    await renderDownloadDataButton(state);
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'false');
    expect(options[1]).toHaveAttribute('aria-disabled', 'true');
    expect(options[2]).toHaveAttribute('aria-disabled', 'false');
  });

  it('Data procesing settings option is disabled if a step misses a sample', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      ...initialExperimentBackendStatus,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
        },
      },
    }));

    const state = {
      ...withDataState,
      experimentSettings: {
        processing: {
          cellSizeDistribution: {
            [sample1Uuid]: {},
          },
        },
      },
    };

    await renderDownloadDataButton(state);
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'false');
    expect(options[1]).toHaveAttribute('aria-disabled', 'false');
    expect(options[2]).toHaveAttribute('aria-disabled', 'true');
  });

  it('Downolods data properly', async () => {
    getFromApiExpectOK.mockImplementation(() => Promise.resolve('signedUrl'));
    getBackendStatus.mockImplementation(() => () => ({
      ...initialExperimentBackendStatus,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
        },
      },
    }));

    await renderDownloadDataButton(withDataState);

    // Open the Download dropdown
    userEvent.click(screen.getByText(/Download/i));

    const downloadButton = screen.getByText(/Raw Seurat object/i);

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    expect(downloadFromUrl).toHaveBeenCalledTimes(1);
  });

  it('Shows an error if there is an error downloading data', async () => {
    getFromApiExpectOK.mockImplementation(() => Promise.reject(new Error('Something went wrong')));
    getBackendStatus.mockImplementation(() => () => ({
      ...initialExperimentBackendStatus,
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
        },
      },
    }));

    await renderDownloadDataButton(withDataState);

    // Open the Download dropdown
    userEvent.click(screen.getByText(/Download/i));

    const downloadButton = screen.getByText(/Raw Seurat object/i);

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
  });

  it('Has options disabled if backend status is still loading', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      loading: true,
      error: false,
      status: null,
    }));

    const state = { ...withDataState };
    await renderDownloadDataButton(state);
    const options = await getMenuItems();

    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    expect(options[1]).toHaveAttribute('aria-disabled', 'true');
    expect(options[2]).toHaveAttribute('aria-disabled', 'true');
  });
});
