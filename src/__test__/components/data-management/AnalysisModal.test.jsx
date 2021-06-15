import React from 'react';
import { List, Input, Button } from 'antd';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import configureMockStore from 'redux-mock-store';
import EditableField from '../../../components/EditableField';
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

const eventStub = {
  stopPropagation: () => { },
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

  it('Renaming experiment works correctly', () => {
    const newProjectName = 'New Project';

    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal activeProject={activeProject} experiments={experiments} />
      </Provider>,
    );

    // Click on edit button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // Input new experiment name
    component.find(Input).at(0).simulate('change', { target: { value: newProjectName } });

    // Click on save button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // Name should be changed
    expect(component.find(EditableField).first().text()).toEqual(newProjectName);
  });

  it('Invalid experiment name', () => {
    const invalidProjectName = '';

    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal activeProject={activeProject} experiments={experiments} />
      </Provider>,
    );

    component.find(EditableField).first();

    // Click on edit button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // Input new experiment name
    component.find(Input).at(0).simulate('change', { target: { value: invalidProjectName } });

    // Click on save button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // Input should not be closed
    expect(component.find(EditableField).first().find(Input).length).toEqual(1);

    // There is a warning text
    expect(component.find(EditableField).first().find('span.ant-typography-danger').length).toEqual(1);
  });

  it('Launch button is disabled if there is a field still editing', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal activeProject={activeProject} experiments={experiments} />
      </Provider>,
    );

    // Click on edit button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // Launch button should be disabled
    expect(component.find(Button).at(3).props().disabled).toEqual(true);

    // Click on cancel button
    component.find(Button).at(1).simulate('click', eventStub);
    component.update();

    // Launch button should be enabled
    expect(component.find(Button).at(2).props().disabled).toEqual(false);
  });
});
