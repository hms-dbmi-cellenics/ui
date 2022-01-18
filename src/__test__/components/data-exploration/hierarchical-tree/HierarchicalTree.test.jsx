import React from 'react';
import { mount } from 'enzyme';
import HierarchicalTree from 'components/data-exploration/hierarchical-tree/HierarchicalTree';
import waitForComponentToPaint from 'utils/tests/waitForComponentToPaint';

import '__test__/test-utils/setupTests';

const experimentId = 'asd';
describe('HierarchicalTree', () => {
  it('Renders correctly', () => {
    const treeData = [{
      key: '1',
      name: 'my element',
      rootNode: false,
      color: '#000000',
    }];

    const component = mount(
      <HierarchicalTree treeData={treeData} experimentId={experimentId} />,
    );
    waitForComponentToPaint(component);
    const tree = component.find('HierarchicalTree Tree');
    expect(tree.length).toEqual(1);
  });

  it('can drag first component at the last position', () => {
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
        pos: '0-0-0',
        props: { eventKey: firstChild.key },
      },
      dragNodesKeys: [firstChild.key],
      dropPosition: 2,
      dropToGap: true,
      node: {
        ...thirdChild,
        pos: '0-0-3',
        props: { eventKey: thirdChild.key },
      },
    };

    const mockOnCellSetReorder = jest.fn();
    const component = mount(
      <HierarchicalTree
        experimentId={experimentId}
        treeData={treeData}
        onCellSetReorder={mockOnCellSetReorder}
      />,
    );
    waitForComponentToPaint(component);
    const tree = component.find('HierarchicalTree Tree');

    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnCellSetReorder).toHaveBeenCalledTimes(1);
    const [cellSetKey, newPosition] = mockOnCellSetReorder.mock.calls[0];

    expect(cellSetKey).toEqual('1a');
    expect(newPosition).toEqual(1);
  });

  it('Can\'t have child component change parent', () => {
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
        pos: '0-0-0',
        props: { eventKey: child.key },
      },
      dragNodesKeys: [child.key],
      dropPosition: 1,
      dropToGap: false,
      node: {
        ...secondParent,
        pos: '0-1-2',
        props: { eventKey: secondParent.key },
      },
    };

    const mockOnCellSetReorder = jest.fn();
    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={experimentId}
        onCellSetReorder={mockOnCellSetReorder}
      />,
    );
    waitForComponentToPaint(component);
    const tree = component.find('HierarchicalTree Tree');
    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnCellSetReorder).toHaveBeenCalledTimes(0);
  });

  it("Can't drop parent inside node", () => {
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

    const treeData = [
      firstParent,
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...secondParent,
        pos: '0-0',
        props: { eventKey: secondParent.key },
      },
      dragNodesKeys: [secondParent.key],
      dropPosition: 1,
      dropToGap: false,
      node: {
        ...firstParent,
        pos: '0-0-1',
        props: { eventKey: firstParent.key },
      },
    };

    const mockOnCellSetReorder = jest.fn();

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={experimentId}
        onCellSetReorder={mockOnCellSetReorder}
      />,
    );
    waitForComponentToPaint(component);
    const tree = component.find('HierarchicalTree Tree');
    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnCellSetReorder).toHaveBeenCalledTimes(0);
  });

  it('tree data is not checked by default', () => {
    const treeData = [{ key: 'louvain' }];
    const mockOnCheck = jest.fn();
    waitForComponentToPaint(mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={experimentId}
        onCheck={mockOnCheck}
      />,
    ));
    expect(mockOnCheck).toHaveBeenCalledTimes(0);
  });
});
