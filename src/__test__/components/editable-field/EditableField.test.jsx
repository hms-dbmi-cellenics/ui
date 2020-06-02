/* eslint-disable react/no-children-prop */
/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import EditableField from '../../../components/editable-field/EditableField';


describe('EditableField', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const component = mount(<EditableField children='Cluster X' defaultText='Some default text' />);
    const popover = component.find('Popover');
    const buttons = popover.find('Button');
    const popoverContent = popover.getElement().props.content;

    expect(component.getElement().props.children).toEqual('Cluster X');
    expect(popover.length).toEqual(1);
    expect(popoverContent.type.name).toEqual('EditablePopoverContent');
    expect(popoverContent.props.defaultText).toEqual('Some default text');
    expect(buttons.length).toEqual(2);
  });

  test('The user can edit the editable field', () => {
    const mockOnEdit = jest.fn();
    const component = shallow(<EditableField children='Cluster X' defaultText='Some default text' onEdit={mockOnEdit} />);

    expect(component.find('Popover').getElement().props.visible).toEqual(false);

    // click the edit button
    component.find('Popover Button').at(0).simulate('click');
    component.update();
    expect(component.find('Popover').getElement().props.visible).toEqual(true);

    // close the popover with new text
    component.find('Popover').getElement().props.content.props.onDone('updated text');
    component.update();
    expect(component.find('Popover').getElement().props.visible).toEqual(false);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith('updated text');
  });

  test('When user is done with editing and the text is the same, the text stays the same', () => {
    const mockOnEdit = jest.fn();
    const component = shallow(<EditableField children='Cluster X' defaultText='Some default text' onEdit={mockOnEdit} />);
    expect(component.find('Popover').getElement().props.visible).toEqual(false);

    // click the edit button
    component.find('Popover Button').at(0).simulate('click');
    component.update();
    expect(component.find('Popover').getElement().props.visible).toEqual(true);

    const popoverContent = shallow(component.find('Popover').props().content);
    popoverContent.find('Button').at(1).simulate('click');
    component.update();
    expect(component.find('Popover').getElement().props.visible).toEqual(false);
    expect(mockOnEdit).toHaveBeenCalledTimes(0);
  });

  test('When delete button is selected, delete function gets triggered', () => {
    const mockOnDelete = jest.fn();
    const component = shallow(<EditableField children='Cluster X' defaultText='Some default text' onDelete={mockOnDelete} />);
    expect(component.find('Popover').getElement().props.visible).toEqual(false);

    // click the delete button
    component.find('Popover Button').at(1).simulate('click');
    component.update();
    expect(component.find('Popover').getElement().props.visible).toEqual(false);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
