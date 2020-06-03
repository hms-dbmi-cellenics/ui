/* eslint-env jest */

import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ColorPicker from '../../../components/color-picker/ColorPicker';

describe('ColorPicker', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const expectedColor = '#ff00ff';
    const component = shallow(<ColorPicker color={expectedColor} />);
    const button = component.find('Button');
    expect(component.find('Popover').getElement().props.trigger).toEqual('click');
    expect(button.length).toEqual(1);
    expect(button.getElement().props.style.backgroundColor).toEqual(expectedColor);
    expect(button.find('Tooltip').length).toEqual(1);
  });

  test('color can be changed', () => {
    const initialColor = '#000000';
    const newColor = '#FFFFFF';
    const wrapper = shallow(<ColorPicker color={initialColor} />);
    expect(wrapper.instance().state.colorPicked).toEqual(initialColor);
    wrapper.instance().handleColorChange({ hex: newColor });
    expect(wrapper.instance().state.colorPicked).toEqual(newColor);
  });
});
