import React from 'react';
import { Button, Select } from 'antd';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Dropzone from 'react-dropzone';
import FileUploadModal from '../../../components/data-management/FileUploadModal';

configure({ adapter: new Adapter() });

const mockStore = configureMockStore([thunk]);
const store = mockStore({});

describe('FileUploadModal', () => {
  it('renders without options', () => {
    const component = shallow(
      <Provider store={store}>
        <FileUploadModal />
      </Provider>,
    );
    expect(component.exists()).toEqual(true);
  });

  it('contains required components', () => {
    const component = mount(
      <Provider store={store}>
        <FileUploadModal />
      </Provider>,
    );

    // It has a select button to select technology
    expect(component.find(Select).length).toEqual(1);

    // It has a dropzone
    expect(component.find(Dropzone).length).toEqual(1);

    // It has a submit button
    expect(component.find(Button).length).toEqual(1);
  });
});
