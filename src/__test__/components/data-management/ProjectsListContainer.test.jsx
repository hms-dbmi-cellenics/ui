import React from 'react';
import { Card } from 'antd';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import ProjectsListContainer from '../../../components/data-management/ProjectsListContainer';
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

const initialStore = mockStore({
  projects: {
    ...initialState,
  },
});

const filledStore = mockStore({
  projects: {
    ...initialState,
    ids: [project1.uuid, project2.uuid],
    meta: {
      activeProjectUuid: project1.uuid,
    },
    [project1.uuid]: project1,
    [project2.uuid]: project2,
  },
});

describe('ProjectsListContainer', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders without options', () => {
    const component = mount(
      <Provider store={initialStore}>
        <ProjectsListContainer />
      </Provider>,
    );

    expect(component.exists()).toEqual(true);
  });

  it('contains required components', () => {
    const component = mount(
      <Provider store={initialStore}>
        <ProjectsListContainer />
      </Provider>,
    );

    // a button by default
    expect(component.find(Card).length).toEqual(0);
  });

  it('has no project if there is no project', () => {
    const projects = initialStore.getState().projects.ids;

    const component = mount(
      <Provider store={initialStore}>
        <ProjectsListContainer />
      </Provider>,
    );

    // expect the number of projects to be the same as the one in the list
    expect(component.find(Card).length).toEqual(projects.length);
  });

  it('contains components if there are projects', () => {
    const projects = filledStore.getState().projects.ids;

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsListContainer />
      </Provider>,
    );

    // expect the number of projects to be the same as the one in the list
    expect(component.find(Card).length).toEqual(projects.length);
  });
});
