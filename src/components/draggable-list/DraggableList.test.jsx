/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import DraggableList from './DraggableList';

describe('DraggableList', () => {
  let root;
  let component;

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

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

    // attachTo is needed because of this issue: https://github.com/atlassian/react-beautiful-dnd/issues/1593
    component = mount(<DraggableList plots={plots} />, { attachTo: root });
  });

  afterEach(() => {
    // this is needed because of this issue: https://github.com/atlassian/react-beautiful-dnd/issues/1593
    document.body.removeChild(root);
  });

  configure({ adapter: new Adapter() });
  test('renders correctly with children', () => {
    const droppables = component.find('DragDropContext').find('Droppable');
    const things = droppables.getElement().props.children('', '');
    const renderedPlots = component.getElement().props.plots;
    const collapse = component.find('DragDropContext').find('Droppable').find('Collapse');
    expect(things.type).toEqual('div');
    expect(renderedPlots.length).toEqual(3);
    expect(collapse.length).toEqual(6);
  });

  // configure({ adapter: new Adapter() });
  // test('reorders correctly on dragging', () => {
  //   const plotsBefore = [{
  //     key: 'item-1',
  //     name: 'a plot 1',
  //     renderer: () => (<span>asd 1</span>),
  //   },
  //   {
  //     key: 'item-2',
  //     name: 'another plot 2',
  //     renderer: () => (<span>asd 2</span>),
  //   }];

  //   const dragResult = {
  //     draggableId: 'item-1',
  //     source: {
  //       index: 0,
  //       droppableId: 'droppable',
  //     },
  //     destination: {
  //       index: 1,
  //       droppableId: 'droppable',
  //     },
  //   };

  //   const plotsAfter = [
  //     {
  //       key: 'item-2',
  //       name: 'another plot 2',
  //       renderer: () => (<span>asd 2</span>),
  //     },
  //     {
  //       key: 'item-1',
  //       name: 'a plot 1',
  //       renderer: () => (<span>asd 1</span>),
  //     },
  //   ];

  //   const mockSetState = jest.fn();
  //   const useStateSpy = jest.spyOn(React, 'useState');
  //   useStateSpy.mockImplementation((init) => [init, mockSetState]);

  //   debugger;

  //   const component = mount(<DraggableList plots={plotsBefore} />);
  //   const dragContext = component.find('DragDropContext').getElement();
  //   const dragEnd = dragContext.props.onDragEnd;
  //   dragEnd(dragResult);
  //   expect(mockSetState).toHaveBeenCalledWith(plotsAfter);
  // });
});
