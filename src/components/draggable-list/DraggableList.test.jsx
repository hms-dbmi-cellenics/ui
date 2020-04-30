/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import DraggableList from './DraggableList';

describe('DraggableList', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly with children', () => {
    const plots = [{
      key: 'item-1',
      name: 'a plot 1',
      renderer: () => (<span>asd 1</span>),
    },
    {
      key: 'item-2',
      name: 'another plot 2',
      renderer: () => (<span>asd 2</span>),
    },
    {
      key: 'item-3',
      name: 'booboo plot 3',
      renderer: () => (<span>asd 3</span>),
    }];
    const component = mount(<DraggableList plots={plots} />);
    const droppables = component.find('DragDropContext').find('Droppable');
    const things = droppables.getElement().props.children('', '');
    const renderedPlots = component.getElement().props.plots;
    const collapse = component.find('DragDropContext').find('Droppable').find('Collapse');

    expect(things.type).toEqual('div');
    expect(renderedPlots.length).toEqual(3);
    expect(collapse.length).toEqual(6);
  });
});
