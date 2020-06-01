/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ContentWrapper from '../../../components/content-wrapper/ContentWrapper';

describe('ColorPicker', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const wrapper = mount(<ContentWrapper />);
    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);
  });

  test('collapses on collapse', () => {
    const wrapper = shallow(<ContentWrapper />);
    expect(wrapper.instance().state.collapsed).toEqual(true);
    wrapper.instance().onCollapse(true);
    expect(wrapper.instance().state.collapsed).toEqual(true);
  });
});
