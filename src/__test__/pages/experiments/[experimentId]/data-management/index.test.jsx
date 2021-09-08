/* eslint-disable import/no-unresolved */
import React from 'react';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, applyMiddleware } from 'redux';
import * as createProject from 'redux/actions/projects/createProject';
import _ from 'lodash';
import preloadAll from 'jest-next-dynamic';

import DataManagementPage from 'pages/data-management/index';
import initialProjectState from 'redux/reducers/projects/initialState';
import initialSamplesState from 'redux/reducers/samples/initialState';
import initialExperimentsState from 'redux/reducers/experiments/initialState';
import initialExperimentSettingsState from 'redux/reducers/experimentSettings/initialState';
import rootReducer from 'redux/reducers/index';

const { screen } = rtl;
const noDataState = {
  projects: {
    ...initialProjectState,
    meta: {
      ...initialProjectState.meta,
      loading: false,
    },
  },
  experiments: {
    ...initialExperimentsState,
  },
  experimentSettings: {
    ...initialExperimentSettingsState,
  },
  samples: {
    ...initialSamplesState,
  },
};

describe('Data-management index test', () => {
  let store;
  let createProjectSpy;
  beforeEach(async () => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
    await preloadAll();
    createProjectSpy = jest.spyOn(createProject, 'default');
  });

  const renderDataManagement = (state) => {
    store = createStore(rootReducer, _.cloneDeep(state), applyMiddleware(thunk));
    rtl.render(
      <Provider store={store}>
        <DataManagementPage route='something' />
      </Provider>,
    );
  };

  it('Has Project Details and Details tiles', () => {
    renderDataManagement(noDataState);
    expect(screen.getByTitle('Project Details')).toBeInTheDocument();
    expect(screen.getByTitle('Projects')).toBeInTheDocument();
  });

  it('Opens create new project modal if no projects', async () => {
    renderDataManagement(noDataState);
    await rtl.waitFor(() => expect(screen.getByText('Create a new project')).toBeInTheDocument());
  });

  it('Creates a new project', async () => {
    renderDataManagement(noDataState);
    await rtl.waitFor(() => expect(screen.getByText('Create a new project')).toBeInTheDocument());

    const projectName = screen.getByPlaceholderText('Ex.: Lung gamma delta T cells');
    const projectDescription = screen.getAllByPlaceholderText('Type description');
    userEvent.type(projectName, 'my new project name');
    userEvent.type(projectDescription, 'this is description');

    const createProjectButton = screen.getByText('Create Project');
    userEvent.click(createProjectButton);
    expect(createProjectSpy).toBeCalled();
  });

  it('Shows loading screen if we are saving projects', () => {
    const newState = {
      ...noDataState,
      projects: {
        ...noDataState.projects,
        meta: {
          ...noDataState.projects.meta,
          saving: true,
        },
      },
    };
    renderDataManagement(newState);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('Shows loading screen if we are saving samples', () => {
    const newState = {
      ...noDataState,
      samples: {
        ...noDataState.samples,
        meta: {
          saving: true,
        },
      },
    };
    renderDataManagement(newState);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
