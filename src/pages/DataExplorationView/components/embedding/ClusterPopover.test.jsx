/* eslint-env jest */

import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ClusterPopover from './ClusterPopover';

describe('ClusterPopover', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const popoverPosition = { x: 0, y: 0 };
    const component = shallow(<ClusterPopover popoverPosition={popoverPosition} />);

    expect(component.find('Popover').length).toEqual(1);

    const popoverContent = component.find('Popover').props().content.props.children;

    expect(popoverContent.length).toEqual(3);
    expect(popoverContent[0].type.name).toEqual('EditableField');
    expect(popoverContent[1].type.name).toEqual('ColorPicker');
    expect(popoverContent[2].type).toEqual('div');
    expect(popoverContent[2].props.children.length).toEqual(2);
    expect(popoverContent[2].props.children[0].type.displayName).toEqual('Button');
    expect(popoverContent[2].props.children[1].type.displayName).toEqual('Button');
  });

  test.skip('default cluster name and cluster color get passed in on create', () => {
    const mockCreate = jest.fn();
    const popoverPosition = { x: 0, y: 0 };
    const component = shallow(<ClusterPopover popoverPosition={popoverPosition} onCreate={mockCreate} />);

    const popoverContent = shallow(component.find('Popover').props().content);
    const createButton = popoverContent.find('div div Button:first-child');

    createButton.simulate('click');
    expect(mockCreate).toBeCalledTimes(1);
    expect(mockCreate).toBeCalledWith('new cluster', '#0000FF');
  });

  test('updated cluster name and color get passed in on create', () => {
    const mockCreate = jest.fn();
    const popoverPosition = { x: 0, y: 0 };
    const component = shallow(<ClusterPopover popoverPosition={popoverPosition} onCreate={mockCreate} />);

    const popoverContent = shallow(component.find('Popover').props().content);
    const editableField = popoverContent.find('div EditableField');
    const colorPicker = popoverContent.find('div ColorPicker');

    editableField.prop('onEdit')('updated cluster name');
    colorPicker.prop('onColorChange')('#999999');
    component.update();

    const createButton = shallow(component.find('Popover').props().content).find('div div Button:first-child');
    createButton.simulate('click');
    expect(mockCreate).toBeCalledTimes(1);
    expect(mockCreate).toBeCalledWith('updated cluster name', '#999999');
  });

  test('popover can be canceled', () => {
    const mockCancel = jest.fn();
    const popoverPosition = { x: 0, y: 0 };

    const component = shallow(<ClusterPopover popoverPosition={popoverPosition} onCancel={mockCancel} />);
    const cancelButton = shallow(component.find('Popover').props().content).find('div div').childAt(1);
    cancelButton.simulate('click');
    expect(mockCancel).toBeCalledTimes(1);
  });
});
