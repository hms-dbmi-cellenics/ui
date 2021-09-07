import React from 'react';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ProjectsListContainer from '../../../components/data-management/ProjectsListContainer';
import initialState, { projectTemplate } from '../../../redux/reducers/projects/initialState';
import samplesInitialState from '../../../redux/reducers/samples/initialState';
import experimentsInitialState from '../../../redux/reducers/experiments/initialState';

jest.mock('localforage');
const mockStore = configureMockStore([thunk]);

const project1 = {
  ...projectTemplate,
  name: 'project 1',
  uuid: '12345',
  createdDate: '01-01-2021',
  lastModified: '01-01-2021',
};

const project2 = {
  ...project1,
  name: 'project 2',
  uuid: '67890',
};

const project3 = {
  ...project1,
  name: 'testing',
  uuid: '45678',
};

const filledStore = mockStore({
  projects: {
    ...initialState,
    ids: [project1.uuid, project2.uuid, project3.uuid],
    meta: {
      activeProjectUuid: project1.uuid,
      saving: false,
      loadng: false,
    },
    [project1.uuid]: project1,
    [project2.uuid]: project2,
    [project3.uuid]: project3,
  },
  samples: {
    ...samplesInitialState,
  },
  experiments: {
    ...experimentsInitialState,
  },
});

describe('ProjectsList', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  it('Contains the default components', () => {
    render(
      <Provider store={filledStore}>
        <ProjectsListContainer />
      </Provider>,
    );

    expect(screen.getByText('Create New Project')).toBeDefined();
    expect(screen.getByPlaceholderText(/Filter by project name/i)).toBeDefined();
  });

  it('Shows create new project modal when button is clicked', () => {
    render(
      <Provider store={filledStore}>
        <ProjectsListContainer />
      </Provider>,
    );

    userEvent.click(screen.getByText('Create New Project'));

    expect(screen.getByText(/Project Name/i));
    expect(screen.getByPlaceholderText(/Ex.: Lung gamma/i));

    expect(screen.getByText(/Project description/i));
    expect(screen.getByPlaceholderText(/Type description/i));
  });
});
