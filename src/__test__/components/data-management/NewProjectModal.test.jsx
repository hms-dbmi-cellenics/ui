import React from 'react';
import { Input, Button } from 'antd';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import '@testing-library/jest-dom';
import NewProjectModal from '../../../pages/data-management/components/NewProjectModal';

configure({ adapter: new Adapter() });

describe('NewProjectModal', () => {
  it('renders without options', () => {
    const component = shallow(<NewProjectModal />);
    expect(component.exists()).toEqual(true);
  });

  it('contains required components', () => {
    const component = mount(<NewProjectModal />);

    // It has a description
    expect(component.find('h3').length).toBeGreaterThan(0);

    // It has an input
    expect(component.find(Input).length).toEqual(1);

    // It has a button
    expect(component.find(Button).length).toEqual(1);
  });
});
