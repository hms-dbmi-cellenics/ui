import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import HierarchicalTree from '../../../../../pages/data-exploration/components/hierarchical-tree/HierarchicalTree';

jest.mock('localforage');

configure({ adapter: new Adapter() });

describe('HierarchicalTree', () => {
  test('renders correctly', () => {
    const treeData = [{
      key: '1',
      name: 'my element',
      rootNode: false,
      color: '#000000',
    }];

    const component = mount(
      <HierarchicalTree treeData={treeData} />,
    );
    const tree = component.find('HierarchicalTree Tree');
    expect(tree.length).toEqual(1);
  });

  test('can drag first component at the last position', () => {
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

    const treeData = [
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

    const mockOnHierarchyUpdate = jest.fn();
    const component = mount(
      <HierarchicalTree treeData={treeData} onHierarchyUpdate={mockOnHierarchyUpdate} />,
    );

    const tree = component.find('HierarchicalTree Tree');
    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnHierarchyUpdate).toHaveBeenCalledTimes(1);
    const firstArgument = mockOnHierarchyUpdate.mock.calls[0][0];
    const childrenKeys = firstArgument[0].children.map((child) => child.key);
    expect(childrenKeys).toEqual(['2a', '3a', '1a']);
  });

  test('Can have child component change parent', () => {
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

    const treeData = [
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

    const mockOnHierarchyUpdate = jest.fn();
    const component = mount(
      <HierarchicalTree treeData={treeData} onHierarchyUpdate={mockOnHierarchyUpdate} />,
    );

    const tree = component.find('HierarchicalTree Tree');
    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnHierarchyUpdate).toHaveBeenCalledTimes(1);
    const firstArgument = mockOnHierarchyUpdate.mock.calls[0][0];

    expect(firstArgument[0].children.length).toEqual(0);
    expect(firstArgument[1].children.length).toEqual(1);
  });

  test("Can't drop parent inside node", () => {
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

    let treeData = [
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

    const mockOnHierarchyUpdate = jest.fn();
    const component = mount(
      <HierarchicalTree treeData={treeData} onHierarchyUpdate={mockOnHierarchyUpdate} />,
    );

    let tree = component.find('HierarchicalTree Tree');
    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnHierarchyUpdate).toHaveBeenCalledTimes(0);

    tree = component.find('HierarchicalTree Tree').getElement();
    treeData = tree.props.treeData;
    expect(treeData.length).toEqual(2);

    expect(mockOnHierarchyUpdate).toHaveBeenCalledTimes(0);
  });
});
