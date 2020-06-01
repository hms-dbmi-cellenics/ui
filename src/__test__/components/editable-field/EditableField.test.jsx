/* eslint-disable react/no-children-prop */
/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import EditableField from '../../../components/editable-field/EditableField';

describe('EditableField', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const component = mount(<EditableField children="Cluster X" defaultText="Some default text" />);
    const popover = component.find('Popover');
    const button = popover.find('Button');
    const popoverContent = popover.getElement().props.content;

    expect(component.getElement().props.children).toEqual('Cluster X');
    expect(popover.length).toEqual(1);
    expect(popoverContent.type.name).toEqual('EditablePopoverContent');
    expect(popoverContent.props.defaultText).toEqual('Some default text');
    expect(button.length).toEqual(1);
    expect(button.getElement().props.children.type.render.displayName).toEqual('EditOutlined');
  });

  test('popover appears when user decides to edit the field name', () => {
    const componentInstance = shallow(<EditableField children="Cluster X" defaultText="Some default text" />).instance();

    expect(componentInstance.state.visible).toEqual(false);

    componentInstance.onPopoverVisibilityChange(true);
    expect(componentInstance.state.visible).toEqual(true);
  });


  test('When user is done with editing, the field name gets updated and popover disappears', () => {
    const mockOnEdit = jest.fn();
    const component = shallow(<EditableField children="Cluster X" defaultText="Some default text" onEdit={mockOnEdit} />);
    const componentInstance = component.instance();
    componentInstance.onPopoverVisibilityChange(true);

    expect(componentInstance.state.visible).toEqual(true);

    componentInstance.closePopover('new text');
    expect(componentInstance.state.visible).toEqual(false);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  test('When user is done with editing and the text is the same, only popover disappears', () => {
    const mockOnEdit = jest.fn();
    const component = shallow(<EditableField children="Cluster X" defaultText="Some default text" onEdit={mockOnEdit} />);
    const componentInstance = component.instance();
    componentInstance.onPopoverVisibilityChange(true);

    expect(componentInstance.state.visible).toEqual(true);

    componentInstance.closePopover('Some default text');
    expect(componentInstance.state.visible).toEqual(false);
    expect(mockOnEdit).toHaveBeenCalledTimes(0);
  });
});
