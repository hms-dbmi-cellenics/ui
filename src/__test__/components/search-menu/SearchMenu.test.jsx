/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import SearchMenu from '../../../components/search-menu/SearchMenu';

describe('SearchMenu', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly with no options', () => {
    const options = [{}];
    const component = mount(<SearchMenu options={options} placeholder='Search things' />);
    const dropdown = component.find('Dropdown');
    expect(dropdown.length).toEqual(1);

    const menu = dropdown.find('Menu');
    const search = dropdown.find('Search');
    expect(search.length).toEqual(1);
    expect(menu.length).toEqual(0);
  });

  test('renders correctly with options', () => {
    const options = [
      {
        key: 'one',
        name: 'item 1',
      },
      {
        key: 'two',
        name: 'item 2',
      },
    ];
    const component = shallow(<SearchMenu options={options} placeholder='Search things' />);
    const menuItems = component.getElement().props.overlay.props.children;
    expect(menuItems.length).toEqual(2);
    const expectedKeys = Object.keys(options);
    const actualKeys = Object.keys(menuItems);
    expect(expectedKeys.includes(actualKeys));
    expect(actualKeys.includes(expectedKeys));
  });

  test('retrieve relevant items from menu on search', () => {
    const options = [
      {
        key: 'one',
        name: 'item 1',
        description: 'an amazing item.',
      },
      {
        key: 'two',
        name: 'item 2',
        description: 'this is a better one',
      },
      {
        key: 'three',
        name: 'item 3',
        description: 'I went bananas',
      },
    ];
    const text1 = 'banana';
    const component = shallow(<SearchMenu options={options} placeholder='Search things' />);
    const s = component.find('Dropdown').find('Search').getElement();
    const actualKeys = s.props.onChange({ target: { value: text1 } });
    expect(actualKeys[0].key).toEqual(options[2].key);
  });
});
