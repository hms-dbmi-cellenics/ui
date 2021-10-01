import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';

import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';
import DownloadDataButton from '../../../components/data-management/DownloadDataButton';
import initialProjectState, { projectTemplate } from '../../../redux/reducers/projects/initialState';
import initialSamplesState from '../../../redux/reducers/samples/initialState';
import initialExperimentsState from '../../../redux/reducers/experiments/initialState';
import initialExperimentSettingsState from '../../../redux/reducers/experimentSettings/initialState';

import { getBackendStatus } from '../../../redux/selectors';
import { initialExperimentBackendStatus } from '../../../redux/reducers/backendStatus/initialState';

jest.mock('../../../redux/selectors');

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
describe('Download data menu', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
  });

  const renderDownloadData = (state) => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <DownloadDataButton activeProjectUuid={projectUuid} />
      </Provider>,
    );
  };

  const getMenuItems = async () => {
    const menu = await screen.getByText('Download');
    expect(menu).not.toBeDisabled();
    act(() => userEvent.click(menu));
    const options = await screen.getAllByRole('menuitem');
    return options;
  };

  it('should render the download data menu', async () => {
    getBackendStatus.mockImplementation(() => () => ({
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDED',
        },
      },
    }));

    await renderDownloadData(withDataState);
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
    await renderDownloadData(state);
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    expect(options[1]).toHaveAttribute('aria-disabled', 'false');
    expect(options[2]).toHaveAttribute('aria-disabled', 'false');
  });

  it('Processed Seurat object option is disabled if qc has not ran', async () => {
    getBackendStatus.mockImplementation(() => () => ({
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

    await renderDownloadData(state);
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'false');
    expect(options[1]).toHaveAttribute('aria-disabled', 'true');
    expect(options[2]).toHaveAttribute('aria-disabled', 'false');
  });

  it('Data procesing settings option is disabled if a step misses a sample', async () => {
    getBackendStatus.mockImplementation(() => () => ({
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

    await renderDownloadData(state);
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'false');
    expect(options[1]).toHaveAttribute('aria-disabled', 'false');
    expect(options[2]).toHaveAttribute('aria-disabled', 'true');
  });
});
