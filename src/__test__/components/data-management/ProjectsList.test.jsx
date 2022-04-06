import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import initialState, { projectTemplate } from 'redux/reducers/projects/initialState';
import ProjectsList from 'components/data-management/ProjectsList';
import ProjectCard from 'components/data-management/ProjectCard';
import '__test__/test-utils/setupTests';

const mockStore = configureMockStore([thunk]);

const project1 = {
  ...projectTemplate,
  name: 'project 1',
  uuid: '12345',
  experiments: ['experiment-1'],
  createdDate: '01-01-2021',
  lastModified: '01-01-2021',
};

const project2 = {
  ...project1,
  name: 'project 2',
  uuid: '67890',
  experiments: ['experiment-2'],
};

const project3 = {
  ...project1,
  name: 'testing',
  uuid: '45678',
  experiments: ['experiment-3'],
};

const initialStore = mockStore({
  projects: {
    ...initialState,
  },
});

const emptyStore = mockStore({
  projects: {
    ...initialState,
    ids: [],
    meta: {
      activeProjectUuid: null,
    },
  },
});

const createMockStore = (projectNames) => {
  const newProjects = projectNames.reduce((acc, name, idx) => {
    acc[idx] = {
      ...projectTemplate,
      name,
      uuid: idx,
    };
    return acc;
  }, {});

  return mockStore({
    projects: {
      ...initialState,
      ids: Object.keys(newProjects),
      meta: {
        activeProjectUuid: Object.keys(newProjects)[0],
      },
      ...newProjects,
    },
  });
};

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
    const testCases = [

      // Filter for one project
      {
        filterText: 'test',
        projectNames: ['testing', 'new project', 'misc'],
        matchingProjects: ['testing'],
      },

      // Filter for more than one project
      {
        filterText: 'test',
        projectNames: ['testing', 'project1', 'testing2'],
        matchingProjects: ['testing', 'testing2'],
      },

      // Filter for projects with the same name
      {
        filterText: 'test',
        projectNames: ['testing', 'project1', 'testing', 'testing'],
        matchingProjects: ['testing', 'testing', 'testing'],
      },

      // Check that filter works for names beginning, containing and ending the filter
      {
        filterText: 'test',
        projectNames: ['testing-project', 'beta-testing', 'project', 'no-test'],
        matchingProjects: ['testing-project', 'beta-testing', 'no-test'],
      },

      // If no projects match, expect no projects to be shown
      {
        filterText: 'test',
        projectNames: ['project1', 'project2', 'project3'],
        matchingProjects: [],
      },
    ];

    testCases.forEach((testCase) => {
      const filter = new RegExp(testCase.filterText, 'i');

      const component = mount(
        <Provider store={createMockStore(testCase.projectNames)}>
          <ProjectsList filter={filter} />
        </Provider>,
      );

      const projects = component.find(ProjectCard);

      expect(projects.length).toEqual(testCase.matchingProjects.length);

      testCase.matchingProjects.forEach((projectName, idx) => {
        expect(projects.at(idx).text()).toMatch(projectName);
      });
    });
  });

  it('Filter should not break if there is no project and no filter', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <ProjectsList />
      </Provider>,
    );

    // Expect there to be no project
    expect(component.find(ProjectCard).length).toEqual(0);
  });

  it('Filter should not break if there is no project and the filter is input', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <ProjectsList />
      </Provider>,
    );

    // Expect there to be no project
    expect(component.find(ProjectCard).length).toEqual(0);
  });

  it('Filter should work when searching using projectUuid', () => {
    const filterText = project3.uuid;
    const filter = new RegExp(filterText, 'i');

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList filter={filter} />
      </Provider>,
    );

    const filteredProjects = component.find(ProjectCard);

    expect(filteredProjects.length).toEqual(1);
    expect(filteredProjects.text()).toMatch(project3.name);
  });

  it('Filter should work when searching using experimentId', () => {
    const filterText = project3.experiments[0];
    const filter = new RegExp(filterText, 'i');

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList filter={filter} />
      </Provider>,
    );

    const filteredProjects = component.find(ProjectCard);

    expect(filteredProjects.length).toEqual(1);
    expect(filteredProjects.text()).toMatch(project3.name);
  });
});
