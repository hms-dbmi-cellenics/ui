import React from 'react';
import { Input, Button, Typography } from 'antd';
import { mount } from 'enzyme';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { ClipLoader } from 'react-spinners';
import NewProjectModal from '../../../components/data-management/NewProjectModal';
import '__test__/test-utils/setupTests';

const { TextArea } = Input;

const { Text } = Typography;

const mockStore = configureMockStore([thunk]);

const initialState = {
  projects: {
    ids: [],
    meta: {
      loading: true,
      saving: false,
      error: false,
    },
  },
};

const storeWithProjects = {
  projects: {
    ids: ['123'],
    meta: {
      loading: true,
      saving: false,
      error: false,
    },
    123: {
      name: 'my awesome project',
    },
  },
};

const onCreate = jest.fn();
const onCancel = jest.fn();

describe('NewProjectModal', () => {
  it('renders without options', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <NewProjectModal onCancel={onCancel} onCreate={onCreate} />
      </Provider>,
    );
    expect(component.exists()).toEqual(true);
  });

  it('contains required components for first time flow', () => {
    const component = mount(
      <Provider store={mockStore(initialState)}>
        <NewProjectModal onCancel={onCancel} onCreate={onCreate} />
      </Provider>,
    );

    // It has a header
    expect(component.find('h3').length).toBeGreaterThan(0);

    // It has an input
    expect(component.find(Input).length).toEqual(1);

    // It has a project description input
    expect(component.find(TextArea).length).toEqual(1);

    // It has a button
    expect(component.find(Button).length).toEqual(1);
  });

  it('contains required components for later flows', () => {
    const component = mount(
      <Provider store={mockStore(storeWithProjects)}>
        <NewProjectModal onCancel={onCancel} onCreate={onCreate} />
      </Provider>,
    );

    // It has no header
    expect(component.find('h3').length).toEqual(0);

    // It has an input
    expect(component.find(Input).length).toEqual(1);

    // It has a project description input
    expect(component.find(TextArea).length).toEqual(1);

    // It has a button
    expect(component.find(Button).length).toEqual(1);
  });

  it('disables input and shows loading when project is being saved', () => {
    const savingState = {
      ...initialState,
      projects: {
        meta: {
          ...initialState.projects.meta,
          saving: true,
        },
        ids: ['123'],
        123: {
          name: 'my awesome project',
        },
      },
    };

    const component = mount(
      <Provider store={mockStore(savingState)}>
        <NewProjectModal onCancel={onCancel} onCreate={onCreate} />
      </Provider>,
    );

    // Named input is disabled
    expect(component.find(Input).props().disabled).toEqual(true);

    // Textarea is disabled
    expect(component.find(TextArea).props().disabled).toEqual(true);

    // It has a spinner
    expect(component.find(ClipLoader).length).toEqual(1);
  });

  it('disables input and shows error if project has errors', () => {
    const errMsg = 'Error message';

    const errorState = {
      ...initialState,
      projects: {
        meta: {
          ...initialState.projects.meta,
          error: errMsg,
        },
        ids: ['123'],
        123: {
          name: 'my awesome project',
        },
      },
    };

    const component = mount(
      <Provider store={mockStore(errorState)}>
        <NewProjectModal />
      </Provider>,
    );

    // Named input is not disabled
    expect(component.find(Input).props().disabled).toEqual(false);

    // Textarea is not disabled
    expect(component.find(TextArea).props().disabled).toEqual(false);

    // It has an error text
    expect(component.find(Text).last().text()).toEqual(errMsg);
  });
});
