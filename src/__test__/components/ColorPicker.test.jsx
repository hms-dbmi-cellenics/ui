import React from 'react';
import { shallow } from 'enzyme';
import ColorPicker from 'components/ColorPicker';

describe('ColorPicker', () => {
  const initialColor = '#ffff00';
  const newColor = '#ff00ff';

  const eventStub = { stopPropagation: () => null };

  it('renders correctly', () => {
    const component = shallow(<ColorPicker color={initialColor} />);
    const button = component.find('Button');
    expect(component.find('Popover').getElement().props.trigger).toEqual('click');
    expect(button.length).toEqual(1);
    expect(button.getElement().props.style.backgroundColor).toEqual(initialColor);
    expect(button.find('Tooltip').length).toEqual(1);
  });

  it('color picker updates but callback does not get called on temporary color change', () => {
    const mockOnColorChange = jest.fn();

    const wrapper = shallow(<ColorPicker color={initialColor} onColorChange={mockOnColorChange} />);
    wrapper.find('Button').simulate('click', eventStub);
    const pickerComponent = shallow(wrapper.find('Popover').props().content);

    // Simulate a temporary edit (e.g. dragging the cursor across the color space in the editor).
    pickerComponent.props().onChange({ hex: newColor });
    wrapper.update();

    // Check if the color of the button changed.
    expect(wrapper.find('Button').props().style.backgroundColor.toUpperCase()).toEqual(newColor.toUpperCase());

    // Check that the callback was not called.
    expect(mockOnColorChange).toHaveBeenCalledTimes(0);
  });

  it('color picker callback gets called on final color change', () => {
    const mockOnColorChange = jest.fn();

    const wrapper = shallow(<ColorPicker color={initialColor} onColorChange={mockOnColorChange} />);
    wrapper.find('Button').simulate('click', eventStub);

    const pickerComponent = shallow(wrapper.find('Popover').props().content);

    // Simulate a permanent edit (e.g. finally settled on a color).
    pickerComponent.props().onChangeComplete({ hex: newColor });
    wrapper.update();

    // Check if the color of the button changed.
    expect(wrapper.find('Button').props().style.backgroundColor.toUpperCase()).toEqual(newColor.toUpperCase());

    // Check that the callback was called.
    expect(mockOnColorChange).toHaveBeenCalledTimes(1);
    expect(mockOnColorChange).toHaveBeenCalledWith(newColor);
  });
});
