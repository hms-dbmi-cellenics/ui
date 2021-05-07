import React from 'react';
import { Input, Button } from 'antd';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import '@testing-library/jest-dom';
import NewProjectModal from '../../../components/data-management/NewProjectModal';

const { TextArea } = Input;

configure({ adapter: new Adapter() });

describe('NewProjectModal', () => {
  it('renders without options', () => {
    const component = shallow(<NewProjectModal />);
    expect(component.exists()).toEqual(true);
  });

  it('contains required components for first time flow', () => {
    const component = mount(<NewProjectModal firstTimeFlow />);

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
    const component = mount(<NewProjectModal firstTimeFlow={false} />);

    // It has no header
    expect(component.find('h3').length).toEqual(0);

    // It has an input
    expect(component.find(Input).length).toEqual(1);

    // It has a project description input
    expect(component.find(TextArea).length).toEqual(1);

    // It has a button
    expect(component.find(Button).length).toEqual(1);
  });
});
