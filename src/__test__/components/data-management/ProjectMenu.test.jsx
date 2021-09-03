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
    expect(component.find(Button).at(0).props().disabled).toEqual(true);
    expect(component.find(Button).at(1).props().disabled).toEqual(true);
    expect(component.find(FileUploadModal).length).toEqual(0);
    expect(component.find(AnalysisModal).length).toEqual(0);
  });

  // it('Renders only add samples enabled when empty project', () => {
  //   const myStore = {

  //     projects: {
  //       ...initialState,
  //       'biomage-project-1': {
  //         createdDate: 'yesterday',
  //         description: '',
  //         experiments: ['1234'],
  //         metadataKeys: [],
  //         name: 'Biomage project 1',
  //         samples: [],
  //         uuid: 'biomage-project-1',
  //       },
  //       ids: ['biomage-project-1'],
  //     },
  //   };

  //   const component = mount(
  //     <Provider store={myStore}>
  //       <ProjectMenu />
  //     </Provider>,
  //   );
  //   expect(component.find(Button).at(0).props().disabled).toEqual(false);
  //   expect(component.find(Button).at(1).props().disabled).toEqual(true);
  //   expect(component.find(FileUploadModal).length).toEqual(0);
  //   expect(component.find(AnalysisModal).length).toEqual(0);
  // });
});
