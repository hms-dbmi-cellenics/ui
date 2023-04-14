import React from 'react';
import { mount, shallow } from 'enzyme';
import { Menu, Input } from 'antd';
import { PictureFilled, PictureOutlined } from '@ant-design/icons';
import SearchMenu from 'components/SearchMenu';

describe('SearchMenu', () => {
  it('renders correctly with no options', () => {
    const options = {};
    const component = mount(<SearchMenu options={options} />);

    const menu = component.find(Menu);
    expect(menu.length).toEqual(1);
    expect(menu.find(Input).length).toEqual(1);
    expect(menu.children().length).toEqual(1);
  });

  it('renders correctly with options and one category', () => {
    const options = {
      category1: [
        {
          key: 'one',
          name: 'item 1',
        },
        {
          key: 'two',
          name: 'item 2',
        },
      ],
      category2: [],
    };
    const component = shallow(<SearchMenu options={options} />);
    const menu = component.find(Menu);

    expect(menu.children().length).toEqual(4);
    expect(menu.childAt(1).find('Divider').length).toEqual(1);
    expect(menu.childAt(1).find('Divider').props().children).toEqual('category1');
    expect(menu.childAt(2).props().children).toMatchSnapshot();
    expect(menu.childAt(3).props().children).toMatchSnapshot();
  });

  it('renders correctly with category info', () => {
    const options = {
      category1: [
        {
          key: 'one',
          name: 'item 1',
        },
        {
          key: 'two',
          name: 'item 2',
        },
      ],
      category2: [],
    };

    const categoryInfo = {
      category1: <PictureFilled />,
      category2: <PictureOutlined />,
    };

    const component = shallow(<SearchMenu options={options} categoryInfo={categoryInfo} />);
    const menu = component.find(Menu);

    expect(menu.children().length).toEqual(4);
    expect(menu.childAt(1).find('Divider').length).toEqual(1);
    expect(menu.childAt(1).find('Divider').props().children).toEqual('category1');
    expect(menu.childAt(2).props().children).toMatchSnapshot();
    expect(menu.childAt(3).props().children).toMatchSnapshot();
  });

  it('retrieves relevant items from menu on search', () => {
    const options = {
      category1: [
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
      ],
    };
    const text1 = 'banana';
    const component = shallow(<SearchMenu options={options} />);
    const menu = component.find(Menu);
    const input = menu.find(Input).getElement();
    const actualKeys = input.props.onChange({ target: { value: text1 } });
    expect(actualKeys.category1).toEqual([options.category1[2]]);
  });
});
