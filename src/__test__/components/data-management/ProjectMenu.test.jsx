import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import { Button } from 'antd';
import ProjectMenu from '../../../components/data-management/ProjectMenu';
import initialState from '../../../redux/reducers/projects/initialState';
import FileUploadModal from '../../../components/data-management/FileUploadModal';
import AnalysisModal from '../../../components/data-management/AnalysisModal';

configure({ adapter: new Adapter() });

const mockStore = configureStore([thunk]);

const noDataState = {
  projects: { ...initialState },
};

describe('ProjectMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders all buttons disabled and nothing else when there is nothing in store', () => {
    const emptyStore = mockStore(noDataState);
    const component = mount(
      <Provider store={emptyStore}>
        <ProjectMenu />
      </Provider>,
    );
    const buttons = component.find(Button);
    expect(buttons.length).toEqual(3);
    expect(buttons.at(0).props().disabled).toEqual(true);
    expect(buttons.at(1).props().disabled).toEqual(true);
    expect(buttons.at(2).props().disabled).toEqual(true);
    expect(component.find(FileUploadModal).length).toEqual(0);
    expect(component.find(AnalysisModal).length).toEqual(0);
  });

  it('Renders only add samples enabled when empty project', () => {
    const myStore = {
      backendStatus: {},
      experiments: {
        ids: ['1234'],
      },
      projects: {
        ...initialState,
        'biomage-project-1': {
          createdDate: 'yesterday',
          description: '',
          experiments: ['1234'],
          metadataKeys: [],
          name: 'Biomage project 1',
          samples: [],
          uuid: 'biomage-project-1',
        },
        meta: {
          activeProjectUuid: 'biomage-project-1',
        },
        ids: ['biomage-project-1'],
      },
    };
    const storeWithProject = mockStore(myStore);

    const component = mount(
      <Provider store={storeWithProject}>
        <ProjectMenu />
      </Provider>,
    );
    const buttons = component.find(Button);
    // Add samples button
    expect(buttons.at(0).props().disabled).toEqual(false);
    // Download button
    expect(buttons.at(1).props().disabled).toEqual(true);
    // Launch analysis button
    expect(buttons.at(1).props().disabled).toEqual(true);

    expect(component.find(FileUploadModal).length).toEqual(0);
    expect(component.find(AnalysisModal).length).toEqual(0);
  });
});
