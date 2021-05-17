import React from 'react';
import { List } from 'antd';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import configureMockStore from 'redux-mock-store';
import AnalysisModal from '../../../components/data-management/AnalysisModal';

configure({ adapter: new Adapter() });

const mockStore = configureMockStore([thunk]);

const initialState = {
  projects: {
    meta: {
      activeProject: 'mock-project',
    },
  },
  'mock-project': {
    name: 'Mock project',
    experiments: ['mock-experiment'],
  },
  experiments: {
    ids: ['mock-experiment'],
    'mock-experiment': {
      name: 'Mock Experiment',
      id: 'mock-experiment',
    },
  },
};

const activeProject = initialState['mock-project'];
const { experiments } = initialState;

describe('AnalysisModal', () => {
  it('renders without options', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal activeProject={activeProject} experiments={experiments} />
      </Provider>,
    );
    expect(component.exists()).toEqual(true);
  });

  it('contains required components', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal activeProject={activeProject} experiments={experiments} />
      </Provider>,
    );

    // It has a list
    expect(component.find(List).length).toEqual(1);

    const numExperiments = experiments.ids.length;

    // There is an experiment in the list
    expect(component.find(List.Item).length).toEqual(numExperiments);
  });
});
