import React from 'react';
import {
  List, Input, Button, Modal,
} from 'antd';
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

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

const initialState = {
  projects: {
    meta: {
      activeProjectUuid: 'mock-project',
    },
    'mock-project': {
      name: 'Mock project',
      experiments: ['mock-experiment'],
    },
    'mock-project-2': {
      name: 'Mock project 2',
      experiments: ['mock-experiment2'],
    },
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

const { experiments } = initialState;

const onLaunchSpy = jest.fn(() => console.log('I am a spy'));
const onCancelSpy = jest.fn();

describe('AnalysisModal', () => {
  it('renders correctly when there are experiments', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal onLaunch={onLaunchSpy} onCancel={onCancelSpy} />
      </Provider>,
    );
    expect(component.exists()).toEqual(true);
    expect(component.find(List).length).toEqual(1);
    const numExperiments = experiments.ids.length;
    expect(component.find(List.Item).length).toEqual(numExperiments);

    const editableFields = component.find(EditableField);
    expect(editableFields.length).toEqual(2);
    expect(onLaunchSpy).toBeCalledTimes(0);
    expect(onCancelSpy).toBeCalledTimes(0);
  });

  it('Renaming experiment works correctly', () => {
    const newProjectName = 'New Project';

    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal onLaunch={onLaunchSpy} onCancel={onCancelSpy} />
      </Provider>,
    );

    const editableFields = component.find(EditableField);
    expect(editableFields.length).toEqual(2);

    // Click on edit experiment name button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // Input new experiment name
    component.find(Input).at(0).simulate('change', { target: { value: newProjectName } });

    // Click on save button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // Launch button should be enabled
    expect(component.find(Button).at(2).props().disabled).toEqual(false);

    // Name should be changed
    expect(component.find(EditableField).first().text()).toEqual(newProjectName);
    expect(onLaunchSpy).toBeCalledTimes(0);
    expect(onCancelSpy).toBeCalledTimes(0);
  });

  it('Launch button is disabled if there is a field still editing', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal onLaunch={onLaunchSpy} onCancel={onCancelSpy} />
      </Provider>,
    );

    expect(component.find(Button).length).toEqual(3);

    // Click on edit button
    component.find(Button).at(0).simulate('click', eventStub);
    component.update();

    // when we are in edit mode, we have 1 more button
    expect(component.find(Button).length).toEqual(4);

    // Launch button should be disabled
    expect(component.find(Button).at(3).props().disabled).toEqual(true);

    // Click on cancel button
    component.find(Button).at(1).simulate('click', eventStub);
    component.update();

    // Launch button should be enabled
    expect(component.find(Button).at(2).props().disabled).toEqual(false);
    expect(onLaunchSpy).toBeCalledTimes(0);
    expect(onCancelSpy).toBeCalledTimes(0);
  });

  it('Launches analysis when launch button is pressed', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal onLaunch={onLaunchSpy} onCancel={onCancelSpy} />
      </Provider>,
    );

    const expectedLaunchedExp = initialState.experiments.ids[0];

    const launchButton = component.find(Button).at(2);
    expect(launchButton.props().disabled).toEqual(false);
    component.find(Button).at(2).simulate('click', eventStub);
    component.update();

    // TODO: will be good to test that the router has been called with
    // the relevant endpoint
    expect(onLaunchSpy).toBeCalledTimes(1);
    expect(onCancelSpy).toBeCalledTimes(0);
    expect(onLaunchSpy).toBeCalledWith(expectedLaunchedExp);
  });

  it('Doesnt launch analysis when analysis modal is closed', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <AnalysisModal onLaunch={onLaunchSpy} onCancel={onCancelSpy} />
      </Provider>,
    );

    const modal = component.find(Modal);
    debugger;
    component.find(Modal).props().onCancel();
    component.update();

    // expect(onLaunchSpy).toBeCalledTimes(0);
    expect(onCancelSpy).toBeCalledTimes(1);
  });
});
