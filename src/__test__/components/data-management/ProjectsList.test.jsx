import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import initialState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import ProjectsList from 'components/data-management/ProjectsList';
import ProjectCard from 'components/data-management/ProjectCard';

const mockStore = configureMockStore([thunk]);

const experiment1 = {
  ...experimentTemplate,
  name: 'experiment 1',
  id: '12345',
  createdAt: '01-01-2021',
  updatedAt: '01-01-2021',
};

const experiment2 = {
  ...experiment1,
  name: 'experiment 2',
  id: '67890',
};

const experiment3 = {
  ...experiment1,
  name: 'testing',
  id: '45678',
};

const initialStore = mockStore({
  experiments: {
    ...initialState,
  },
});

const emptyStore = mockStore({
  experiments: {
    ...initialState,
    ids: [],
    meta: {
      activeExperimentId: null,
    },
  },
});

const createMockStore = (experimentNames) => {
  const newExperiments = experimentNames.reduce((acc, name, idx) => {
    acc[idx] = {
      ...experimentTemplate,
      name,
      id: idx,
    };
    return acc;
  }, {});

  return mockStore({
    experiments: {
      ...initialState,
      ids: Object.keys(newExperiments),
      meta: {
        activeExperimentId: Object.keys(newExperiments)[0],
      },
      ...newExperiments,
    },
  });
};

const filledStore = mockStore({
  experiments: {
    ...initialState,
    ids: [experiment1.id, experiment2.id, experiment3.id],
    meta: {
      activeExperimentId: experiment1.id,
    },
    [experiment1.id]: experiment1,
    [experiment2.id]: experiment2,
    [experiment3.id]: experiment3,
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

  it('has no experiment if there is no experiment', () => {
    const experiments = initialStore.getState().experiments.ids;

    const component = mount(
      <Provider store={initialStore}>
        <ProjectsList />
      </Provider>,
    );

    // expect the number of experiments to be the same as the one in the list
    expect(component.find(ProjectCard).length).toEqual(experiments.length);
  });

  it('contains components if there are experiments', () => {
    const experiments = filledStore.getState().experiments.ids;

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList />
      </Provider>,
    );

    // expect the number of experiments to be the same as the one in the list
    expect(component.find(ProjectCard).length).toEqual(experiments.length);
  });

  it('Shows all experiments if not given a filter', () => {
    const experiments = filledStore.getState().experiments.ids;

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList />
      </Provider>,
    );

    // Expect all experiments to be shown
    expect(component.find(ProjectCard).length).toEqual(experiments.length);
  });

  it('Filters the correct experiment given a filter', () => {
    const testCases = [

      // Filter for one experiment
      {
        filterText: 'test',
        experimentNames: ['testing', 'new experiment', 'misc'],
        matchingExperiments: ['testing'],
      },

      // Filter for more than one experiment
      {
        filterText: 'test',
        experimentNames: ['testing', 'project1', 'testing2'],
        matchingExperiments: ['testing', 'testing2'],
      },

      // Filter for experiments with the same name
      {
        filterText: 'test',
        experimentNames: ['testing', 'project1', 'testing', 'testing'],
        matchingExperiments: ['testing', 'testing', 'testing'],
      },

      // Check that filter works for names beginning, containing and ending the filter
      {
        filterText: 'test',
        experimentNames: ['testing-project', 'beta-testing', 'project', 'no-test'],
        matchingExperiments: ['testing-project', 'beta-testing', 'no-test'],
      },

      // If no projects match, expect no projects to be shown
      {
        filterText: 'test',
        experimentNames: ['experiment1', 'project2', 'project3'],
        matchingExperiments: [],
      },
    ];

    testCases.forEach((testCase) => {
      const filter = new RegExp(testCase.filterText, 'i');

      const component = mount(
        <Provider store={createMockStore(testCase.experimentNames)}>
          <ProjectsList filter={filter} />
        </Provider>,
      );

      const experiments = component.find(ProjectCard);

      expect(experiments.length).toEqual(testCase.matchingExperiments.length);

      testCase.matchingExperiments.forEach((experimentName, idx) => {
        expect(experiments.at(idx).text()).toMatch(experimentName);
      });
    });
  });

  it('Filter should not break if there is no experiment and no filter', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <ProjectsList />
      </Provider>,
    );

    // Expect there to be no experiment
    expect(component.find(ProjectCard).length).toEqual(0);
  });

  it('Filter should not break if there is no experiment and the filter is input', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <ProjectsList />
      </Provider>,
    );

    // Expect there to be no experiment
    expect(component.find(ProjectCard).length).toEqual(0);
  });

  it('Filter should work when searching using experimentId', () => {
    const filterText = experiment3.id;
    const filter = new RegExp(filterText, 'i');

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList filter={filter} />
      </Provider>,
    );

    const filteredExperiments = component.find(ProjectCard);

    expect(filteredExperiments.length).toEqual(1);
    expect(filteredExperiments.text()).toMatch(experiment3.name);
  });

  it('Filter should work when searching using experimentId', () => {
    const filter = new RegExp(experiment3.id, 'i');

    const component = mount(
      <Provider store={filledStore}>
        <ProjectsList filter={filter} />
      </Provider>,
    );

    const filteredExperiments = component.find(ProjectCard);

    expect(filteredExperiments.length).toEqual(1);
    expect(filteredExperiments.text()).toMatch(experiment3.name);
  });
});
