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

    // const popoverContent = component.find('Popover').props().content.props.children;
    const popoverContent = shallow(component.find('Popover').props().content);

    expect(popoverContent.length).toEqual(1);

    expect(popoverContent.find('EditableField').length).toEqual(1);
    expect(popoverContent.find('ColorPicker').length).toEqual(1);
    expect(popoverContent.find('Button').length).toEqual(2);
    expect(popoverContent.find('Button[type="primary"]').length).toEqual(1);
  });

  test('default cluster name and cluster color get passed in on create', () => {
    const mockCreate = jest.fn();
    const popoverPosition = { x: 0, y: 0 };
    const component = shallow(<ClusterPopover popoverPosition={popoverPosition} onCreate={mockCreate} />);

    const popoverContent = shallow(component.find('Popover').props().content);
    const createButton = popoverContent.find('Button[type="primary"]');

    createButton.simulate('click');
    expect(mockCreate).toBeCalledTimes(1);
    expect(mockCreate).toBeCalledWith('New Cluster', '#0000FF');
  });

  test('updated cluster name and color get passed in on create', () => {
    const mockCreate = jest.fn();
    const popoverPosition = { x: 0, y: 0 };
    const component = shallow(<ClusterPopover popoverPosition={popoverPosition} onCreate={mockCreate} />);

    let popoverContent = shallow(component.find('Popover').props().content);
    const editableField = popoverContent.find('EditableField');
    const colorPicker = popoverContent.find('ColorPicker');

    editableField.prop('onEdit')('updated cluster name');
    colorPicker.prop('onColorChange')('#999999');
    popoverContent = shallow(component.find('Popover').props().content);

    const createButton = popoverContent.find('Button[type="primary"]');
    createButton.simulate('click');
    expect(mockCreate).toBeCalledTimes(1);
    expect(mockCreate).toBeCalledWith('updated cluster name', '#999999');
  });


  test('popover can be canceled', () => {
    const mockCancel = jest.fn();
    const popoverPosition = { x: 0, y: 0 };

    const component = shallow(<ClusterPopover popoverPosition={popoverPosition} onCancel={mockCancel} />);
    const popoverContent = shallow(component.find('Popover').props().content);
    const cancelButton = popoverContent.find('Button[type="default"]');

    cancelButton.simulate('click');
    expect(mockCancel).toBeCalledTimes(1);
  });
});
