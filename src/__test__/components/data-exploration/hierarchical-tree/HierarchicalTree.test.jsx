import React from 'react';
import { mount } from 'enzyme';
import HierarchicalTree from 'components/data-exploration/hierarchical-tree/HierarchicalTree';
import waitForComponentToPaint from 'utils/tests/waitForComponentToPaint';

import '__test__/test-utils/setupTests';

const experimentId = 'asd';
describe('HierarchicalTree', () => {
  const child = {
    key: '1a',
    name: 'first child',
    color: '#00FF00',
  };

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
      },
      dragNodesKeys: [firstChild.key],
      dropPosition: 2,
      dropToGap: true,
      node: {
        ...thirdChild,
        pos: '0-0-3',
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
      },
      dragNodesKeys: [child.key],
      dropPosition: 1,
      dropToGap: true,
      node: {
        ...secondParent,
        pos: '0-1-2',
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
    const treeData = [
      firstParent,
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...secondParent,
        pos: '0-0',
      },
      dragNodesKeys: [secondParent.key],
      dropPosition: 1,
      dropToGap: true,
      node: {
        ...firstParent,
        pos: '0-0-1',
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

  it("Can't drag child across parent nodes", () => {
    const treeData = [
      firstParent,
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...child,
        pos: '0-0-1',
      },
      dragNodesKeys: [secondParent.key],
      dropPosition: 4,
      dropToGap: true,
      node: {
        ...secondParent,
        pos: '0-1-0',
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

  it("Doesn't trigger drop if positions don't change", () => {
    const treeData = [
      firstParent,
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...child,
        pos: '0-0-1',
      },
      dragNodesKeys: [secondParent.key],
      dropPosition: 1,
      dropToGap: true,
      node: {
        ...child,
        key: '1b',
        pos: '0-0-1',
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

  it("Can't drop into a child, only in a gap", () => {
    const treeData = [
      firstParent,
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...child,
        pos: '0-0-1',
      },
      dragNodesKeys: [secondParent.key],
      dropPosition: 4,
      dropToGap: false,
      node: {
        ...child,
        key: '1b',
        pos: '0-0-5',
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

    // but dropToGap: false can be false when the dropInfo is rootNode
    // (we see this when we are moving the cell set into the first spot)
    const newDropInfo = {
      ...dropInfo,
      node: {
        ...firstParent,
        pos: '0-0',
      },
    };

    tree.getElement().props.onDrop(newDropInfo);
    component.update();
    expect(mockOnCellSetReorder).toHaveBeenCalledTimes(1);
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
