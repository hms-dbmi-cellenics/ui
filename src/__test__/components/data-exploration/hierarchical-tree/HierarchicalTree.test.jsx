import React from 'react';
import { mount } from 'enzyme';

import {
  EditOutlined, DeleteOutlined,
} from '@ant-design/icons';

import HierarchicalTree from 'components/data-exploration/hierarchical-tree/HierarchicalTree';
import waitForComponentToPaint from '__test__/test-utils/waitForComponentToPaint';

import fake from '__test__/test-utils/constants';

const firstChild = {
  key: '1a',
  name: 'first child',
  rootNode: false,
  color: '#00FF00',
};

const secondChild = {
  key: '2a',
  name: 'second child',
  rootNode: false,
  color: '#00FF00',
};

const thirdChild = {
  key: '3a',
  name: 'third child',
  rootNode: false,
  color: '#00FF00',
};

const firstParent = {
  key: 'scratchpad',
  name: 'parent 1',
  rootNode: true,
  children: [firstChild, secondChild],
};

const secondParent = {
  key: '2',
  name: 'parent 2',
  rootNode: true,
  children: [thirdChild],
};

describe('HierarchicalTree', () => {
  it('Renders correctly', () => {
    const treeData = [{
      key: '1',
      name: 'my element',
      rootNode: false,
      color: '#000000',
    }];

    const component = mount(
      <HierarchicalTree treeData={treeData} experimentId={fake.EXPERIMENT_ID} />,
    );
    waitForComponentToPaint(component);
    const tree = component.find('HierarchicalTree Tree');
    expect(tree).toHaveLength(1);
  });

  it('can drag first component at the last position', () => {
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
      dropPosition: 2,
      dropToGap: true,
      node: {
        ...thirdChild,
        pos: '0-0-3',
        dragOver: false,
      },
    };

    const mockOnCellSetReorder = jest.fn();
    const component = mount(
      <HierarchicalTree
        experimentId={fake.EXPERIMENT_ID}
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
          firstChild,
        ],
      },
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...firstChild,
        pos: '0-0-0',
      },
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
        experimentId={fake.EXPERIMENT_ID}
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
        experimentId={fake.EXPERIMENT_ID}
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
        ...firstChild,
        pos: '0-0-1',
      },
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
        experimentId={fake.EXPERIMENT_ID}
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
        ...firstChild,
        pos: '0-0-1',
      },
      dropPosition: 1,
      dropToGap: true,
      node: {
        ...firstChild,
        key: '1b',
        pos: '0-0-1',
      },
    };

    const mockOnCellSetReorder = jest.fn();

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={fake.EXPERIMENT_ID}
        onCellSetReorder={mockOnCellSetReorder}
      />,
    );

    waitForComponentToPaint(component);
    const tree = component.find('HierarchicalTree Tree');
    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnCellSetReorder).toHaveBeenCalledTimes(0);
  });

  it('Can drop in child as if it dropped in gap', () => {
    const treeData = [
      firstParent,
      secondParent,
    ];

    const dropInfo = {
      dragNode: {
        ...firstChild,
        pos: '0-0-1',
      },
      dropPosition: 4,
      dropToGap: false,
      node: {
        ...firstChild,
        key: '1b',
        pos: '0-0-5',
        dragOver: true,
      },
    };

    const mockOnCellSetReorder = jest.fn();

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={fake.EXPERIMENT_ID}
        onCellSetReorder={mockOnCellSetReorder}
      />,
    );

    waitForComponentToPaint(component);
    const tree = component.find('HierarchicalTree Tree');
    tree.getElement().props.onDrop(dropInfo);
    component.update();

    expect(mockOnCellSetReorder).toHaveBeenCalledTimes(1);

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
    expect(mockOnCellSetReorder).toHaveBeenCalledTimes(2);
  });

  it('tree data is not checked by default', async () => {
    const treeData = [{ key: 'louvain' }];
    const mockOnCheck = jest.fn();

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={fake.EXPERIMENT_ID}
        onCheck={mockOnCheck}
      />,
    );

    await waitForComponentToPaint(component);

    expect(mockOnCheck).toHaveBeenCalledTimes(0);
  });

  it('triggers onNodeUpdate if a color was changed', async () => {
    const treeData = [
      firstParent,
    ];

    const mockOnNodeUpdate = jest.fn();

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={fake.EXPERIMENT_ID}
        onNodeUpdate={mockOnNodeUpdate}
        shouldExpandKeys
      />,
    );

    await waitForComponentToPaint(component);

    // Only 2 color pickers are shown
    expect(component.find('ColorPicker')).toHaveLength(2);

    // On changing one color
    const childColorPicker = component.find('ColorPicker').at(0);
    childColorPicker.getElement().props.onColorChange('white');
    component.update();

    // The callback is triggered
    expect(mockOnNodeUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnNodeUpdate).toHaveBeenCalledWith('1a', { color: 'white' });
  });

  it('triggers onNodeUpdate if a name was changed', async () => {
    const treeData = [
      firstParent,
    ];

    const mockOnNodeUpdate = jest.fn();

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={fake.EXPERIMENT_ID}
        onNodeUpdate={mockOnNodeUpdate}
        shouldExpandKeys
      />,
    );

    await waitForComponentToPaint(component);

    const childEditableField = component.find('EditableField').at(0);
    const parentEditableField = component.find('EditableField').at(2);

    // The child node can be edited
    expect(childEditableField.find(EditOutlined)).toHaveLength(1);

    // The root node scratchpad can't be edited
    expect(parentEditableField.find(EditOutlined)).toHaveLength(0);

    // When we edit
    childEditableField.getElement().props.onAfterSubmit('New name');
    component.update();

    // Callback is triggered
    expect(mockOnNodeUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnNodeUpdate).toHaveBeenCalledWith('1a', { name: 'New name' });
  });

  it('triggers onNodeDelete if a node was deleted', async () => {
    const treeData = [
      firstParent,
    ];

    const mockOnNodeDelete = jest.fn();

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={fake.EXPERIMENT_ID}
        onNodeDelete={mockOnNodeDelete}
        shouldExpandKeys
      />,
    );

    await waitForComponentToPaint(component);

    const childEditableField = component.find('EditableField').at(0);
    const parentEditableField = component.find('EditableField').at(2);

    // The child node can be edited
    expect(childEditableField.find(DeleteOutlined)).toHaveLength(1);

    // The root node scratchpad can't be deleted
    expect(parentEditableField.find(DeleteOutlined)).toHaveLength(0);

    childEditableField.getElement().props.onDelete();
    component.update();

    expect(mockOnNodeDelete).toHaveBeenCalledTimes(1);
    expect(mockOnNodeDelete).toHaveBeenCalledWith('1a', false);
  });

  it('Doesn\'t crash if callbacks aren\'t defined', async () => {
    const treeData = [
      firstParent,
    ];

    const component = mount(
      <HierarchicalTree
        treeData={treeData}
        experimentId={fake.EXPERIMENT_ID}
        shouldExpandKeys
      />,
    );

    const childEditableField = component.find('EditableField').at(0);
    const childColorPicker = component.find('ColorPicker').at(0);
    const tree = component.find('HierarchicalTree Tree');

    childEditableField.getElement().props.onDelete();
    component.update();

    childEditableField.getElement().props.onAfterSubmit();
    component.update();

    childColorPicker.getElement().props.onColorChange();
    component.update();

    tree.getElement().props.onCheck();
    component.update();

    const dropInfo = {
      dragNode: {
        ...firstChild,
        pos: '0-0-0',
      },
      dropPosition: 2,
      dropToGap: true,
      node: {
        ...secondChild,
        pos: '0-0-1',
      },
    };

    tree.getElement().props.onDrop(dropInfo);
    component.update();
  });
});
