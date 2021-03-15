import React from 'react';
import { Button, Select } from 'antd';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Dropzone from 'react-dropzone';
import FileUploadModal from '../../../components/data-management/FileUploadModal';

configure({ adapter: new Adapter() });

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('FileUploadModal', () => {
  it('renders without options', () => {
    const component = shallow(<FileUploadModal />);
    expect(component.exists()).toEqual(true);
  });

  it('contains required components', () => {
    const component = mount(<FileUploadModal />);

    // It has a select button to select technology
    expect(component.find(Select).length).toEqual(1);

    // It has a dropzone
    expect(component.find(Dropzone).length).toEqual(1);

    // It has a submit button
    expect(component.find(Button).length).toEqual(1);
  });
});
