/* eslint-env jest */

import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ColorPicker from './ColorPicker';

describe('ColorPicker', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const expectedColor = '#ff00ff';
    const component = shallow(<ColorPicker color={expectedColor} />).getElement();
    const d = component.props.children.props;

    expect(component.props.trigger).toEqual('click');
    expect(d.htmlType).toEqual('button');
    expect(d.type).toEqual('dashed');
    expect(d.children.props.color).toEqual(expectedColor);
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
