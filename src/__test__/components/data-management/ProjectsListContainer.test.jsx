import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Skeleton } from 'antd';
import ProjectsListContainer from '../../../components/data-management/ProjectsListContainer';

configure({ adapter: new Adapter() });

jest.mock('localforage');
const mockStore = configureMockStore([thunk]);

const loadingState = {
  projects: {
    meta: {
      loading: true,
    },
  },
};

const loadedState = {
  projects: {
    ids: [],
    meta: {
      loading: false,
    },
  },
};

describe('ProjectsList', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  it('Contains loaders when loading', () => {
    const component = mount(
      <Provider store={mockStore(loadingState)}>
        <ProjectsListContainer />
      </Provider>,
    );

    expect(component.find(Skeleton).length).toBeGreaterThan(0);
  });

  it('Contains the input box when not loading', () => {
    render(
      <Provider store={mockStore(loadedState)}>
        <ProjectsListContainer />
      </Provider>,
    );

    expect(screen.getByPlaceholderText(/Filter by project name/i)).toBeDefined();
  });
});
