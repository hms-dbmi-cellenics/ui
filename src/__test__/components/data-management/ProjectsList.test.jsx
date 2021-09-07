import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import { Button, Input } from 'antd';
import ProjectsList from '../../../components/data-management/ProjectsList';
import ProjectCard from '../../../components/data-management/ProjectCard';
import initialState, { projectTemplate } from '../../../redux/reducers/projects/initialState';

jest.mock('localforage');
configure({ adapter: new Adapter() });
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

const initialStore = mockStore({
  projects: {
    ...initialState,
  },
});

const filledStore = mockStore({
  projects: {
    ...initialState,
    ids: [project1.uuid, project2.uuid, project3.uuid],
    meta: {
      activeProjectUuid: project1.uuid,
    },
    [project1.uuid]: project1,
    [project2.uuid]: project2,
    [project3.uuid]: project3,
  },
});

describe('ProjectsList', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  it('renders without options', () => {
    const component = mount(
      <Provider store={initialStore}>
        <ProjectsList />
      </Provider>,
    );

    expect(component.exists()).toEqual(true);
  });

  it('has no project if there is no project', () => {
    const projects = initialStore.getState().projects.ids;

    const component = mount(
      <Provider store={initialStore}>
        <ProjectsList />
      </Provider>,
    );

    // expect the number of projects to be the same as the one in the list
    expect(component.find(ProjectCard).length).toEqual(projects.length);
  });

  it('contains components if there are projects', () => {
    const projects = filledStore.getState().projects.ids;

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList />
      </Provider>,
    );

    // expect the number of projects to be the same as the one in the list
    expect(component.find(ProjectCard).length).toEqual(projects.length);
  });

  it('Shows all projects if not given a filter', () => {
    const projects = filledStore.getState().projects.ids;

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList />
      </Provider>,
    );

    // Expect all projects to be shown
    expect(component.find(ProjectCard).length).toEqual(projects.length);
  });

  it('Filters the correct project given a filter', () => {
    const filter = new RegExp('test', 'ig');

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList filter={filter} />
      </Provider>,
    );

    // Expect only 1 project to be shown
    expect(component.find(ProjectCard).length).toEqual(1);
  });
});
