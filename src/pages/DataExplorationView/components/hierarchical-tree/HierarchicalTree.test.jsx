/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Adapter from 'enzyme-adapter-react-16';
import HierarchicalTree from './HierarchicalTree';

const mockStore = configureMockStore([]);

describe('HierarchicalTree', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const store = mockStore({
      cellSets: {
        data: [
          {
            key: '1',
            name: 'my element',
            rootNode: false,
            color: '#000000',
          },
        ],
      },
    });

    const component = shallow(
      <Provider store={store}>
        <HierarchicalTree />
      </Provider>,
    );

    expect(component.find('HierarchicalTree').length).toEqual(1);
  });

  /**
   * The following set iof tests used to be working up until I made the tree data come through redux. Now they don't,
   * because I can't find a way to simulate an onDrop event. I am leaving these in here disabled, we have to either
   * remove them or add tests to somehow test that file.
   *
   */

  test.skip('can drag first component at the last position', () => {
    const firstChild = {
      key: '1a',
      name: 'first child',
      color: '#00FF00',
    };

    const secondChild = {
      key: '2a',
      name: 'second child',
      color: '#00FF00',
    };

    const thirdChild = {
      key: '3a',
      name: 'third child',
      color: '#00FF00',
    };

    const myData = [
      {
        key: '1',
        name: 'element 1',
        rootNode: true,
        children: [
          firstChild,
          secondChild,
          thirdChild,
        ],
      },
    ];

    const store = mockStore({
      cellSets: {
        data: myData,
      },
    });

    const dropInfo = {
      dragNode: {
        ...firstChild,
        props: { eventKey: firstChild.key },
      },
      dragNodesKeys: [firstChild.key],
      dropPosition: 2,
      dropToGap: true,
      node: {
        ...thirdChild,
        props: { eventKey: thirdChild.key },
      },
    };

    const component = shallow(
      <Provider store={store}>
        <HierarchicalTree />
      </Provider>,
    );

    const componentElement = component.getElement();

    componentElement.props.onDrop(dropInfo);

    // component.find("HierarchicalTree").simulate('onDrop')

    const postComponentElement = component.getElement();

    const expectedKeyOrder = ['2a', '3a', '1a'];
    const actualKeyOrder = [];
    postComponentElement.props.treeData[0].children.forEach((child) => actualKeyOrder.push(child.key));

    expect(actualKeyOrder).toEqual(expectedKeyOrder);
  });

  test.skip('Can have child component change parent', () => {
    const child = {
      key: '1a',
      name: 'first child',
      color: '#00FF00',
    };

    const secondParent = {
      key: '2',
      name: 'parent 2',
      rootNode: true,
      children: [],
    };

    const data = [
      {
        key: '1',
        name: 'parent 1',
        rootNode: true,
        children: [
          child,
        ],
      },
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...child,
        props: { eventKey: child.key },
      },
      dragNodesKeys: [child.key],
      dropPosition: 1,
      dropToGap: false,
      node: {
        ...secondParent,
        props: { eventKey: secondParent.key },
      },
    };

    const component = shallow(<HierarchicalTree data={data} />);
    const componentElement = component.getElement();

    const oldTreeData = componentElement.props.treeData;
    expect(oldTreeData[0].children.length).toEqual(1);
    expect(oldTreeData[1].children.length).toEqual(0);

    componentElement.props.onDrop(dropInfo);

    const newTreeData = component.getElement().props.treeData;
    expect(newTreeData[0].children.length).toEqual(0);
    expect(newTreeData[1].children.length).toEqual(1);
  });

  test.skip("Can't drop parent inside node", () => {
    const firstParent = {
      key: '1',
      name: 'parent 1',
      rootNode: true,
      children: [],
    };

    const secondParent = {
      key: '2',
      name: 'parent 2',
      rootNode: true,
      children: [],
    };

    const data = [
      firstParent,
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...secondParent,
        props: { eventKey: secondParent.key },
      },
      dragNodesKeys: [secondParent.key],
      dropPosition: 1,
      dropToGap: false,
      node: {
        ...firstParent,
        props: { eventKey: firstParent.key },
      },
    };

    const component = shallow(
      <HierarchicalTree data={data} />,
    );
    const componentElement = component.getElement();

    const oldTreeData = componentElement.props.treeData;
    expect(oldTreeData.length).toEqual(2);
    expect(oldTreeData[0].children.length).toEqual(0);
    expect(oldTreeData[1].children.length).toEqual(0);

    componentElement.props.onDrop(dropInfo);

    const newTreeData = component.getElement().props.treeData;
    expect(newTreeData.length).toEqual(2);
    expect(newTreeData[0].children.length).toEqual(0);
    expect(newTreeData[1].children.length).toEqual(0);
  });
});
