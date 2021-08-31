import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, applyMiddleware } from 'redux';
import preloadAll from 'jest-next-dynamic';

import _ from 'lodash';
import { act } from 'react-dom/test-utils';
import rootReducer from '../../../redux/reducers/index';
import DownloadData from '../../../components/data-management/DownloadData';
import initialProjectState, { projectTemplate } from '../../../redux/reducers/projects/initialState';
import initialSamplesState from '../../../redux/reducers/samples/initialState';
import initialExperimentsState from '../../../redux/reducers/experiments/initialState';
import initialExperimentSettingsState from '../../../redux/reducers/experimentSettings/initialState';

const { screen, render } = rtl;
const projectName = 'Project 1';
const projectUuid = 'project-1-uuid';
const projectDescription = 'Some description';
const experimentId = 'my-experiment-🧬';
const sample1Name = 'Sample 1';
const sample1Uuid = 'sample-1';
const sample2Name = 'Sample 2';
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
  backendStatus: {
    [experimentId]: {
      status: {
        pipeline: {
          status: 'SUCCEEDED',
        },
        gem2s: {
          status: 'SUCCEEDEDD',
        },
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
    const store = createStore(rootReducer, _.cloneDeep(state), applyMiddleware(thunk));
    render(
      <Provider store={store}>
        <DownloadData activeProjectUuid={projectUuid} />
      </Provider>,
    );
  };

  const getManuItems = async () => {
    const menu = await screen.getByText('Download');
    expect(menu).not.toBeDisabled();
    act(() => userEvent.click(menu));
    const options = await screen.getAllByRole('menuitem');
    return options;
  };

  it('should render the download data menu', async () => {
    await renderDownloadData(withDataState);
    const options = await getManuItems();
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Raw Seurat object (.rds)');
    expect(options[1]).toHaveTextContent('Processed Seurat object (.rds)');
    expect(options[2]).toHaveTextContent('Data Processing settings (.txt)');
    expect(options[0]).not.toBeDisabled();
    expect(options[1]).not.toBeDisabled();
    expect(options[2]).not.toBeDisabled();
  });

  it('Raw seurat object option is disabled if gem2s has not ran', async () => {
    const state = {
      ...withDataState,
      backendStatus: {
        [experimentId]: {
          ...withDataState.backendStatus[experimentId],
          gem2s: {
            status: 'DEFINETELY NOT SUCCEEDED',
          },
        },
      },
    };
    await renderDownloadData(state);
    const options = await getManuItems();
    expect(options[0]).toHaveAttribute('aria-disabled');
    expect(options[1]).toHaveAttribute('aria-disabled=false');
    expect(options[2]).toHaveAttribute('aria-disabled=false');
  });

  it('Processed Seurat object option is disabled if qc has not ran', async () => {
    const state = {
      ...withDataState,
      backendStatus: {
        [experimentId]: {
          ...withDataState.backendStatus[experimentId],
          pipeline: {
            status: 'DEFINETELY NOT SUCCEEDED',
          },
        },
      },
    };
    await renderDownloadData(state);
    const options = await getManuItems();
    expect(options[1]).toHaveAttribute('aria-disabled');
    expect(options[0]).toHaveAttribute('aria-disabled');
    expect(options[2]).toHaveAttribute('aria-disabled=false');
  });

  // it('Data procesing option is disabled ');
});
