import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Tree, Space, Skeleton,
} from 'antd';
import {
  DownOutlined,
} from '@ant-design/icons';

import EditableField from 'components/EditableField';
import ColorPicker from 'components/ColorPicker';
import FocusButton from 'components/FocusButton';
import HideButton from 'components/data-exploration/cell-sets-tool/HideButton';

import 'components/data-exploration/hierarchical-tree/hierarchicalTree.css';

const HierarchicalTree = (props) => {
  const {
    onCheck: propOnCheck,
    defaultCheckedKeys: propDefaultCheckedKeys,
    treeData,
    store,
    experimentId,
    showHideButton,
    onCellSetReorder,
    onNodeUpdate,
    onNodeDelete,
    shouldExpandKeys,
  } = props;

  const [checkedKeys, setCheckedKeys] = useState(propDefaultCheckedKeys);
  const [expandedKeys, setExpandedKeys] = useState(propDefaultCheckedKeys);

  useEffect(() => {
    if (checkedKeys.length > 0) {
      onCheck(checkedKeys);
    }
  }, []);

  const onCheck = useCallback((keys) => {
    setCheckedKeys(keys);
    propOnCheck(keys);
  }, []);

  const onDrop = useCallback((info) => {
    const {
      dragNode, node, dropPosition, dropToGap,
    } = info;

    // If rootNode, ignore
    if (dragNode.rootNode) return;

    // Ignore topmost drop position
    if (dropPosition === -1) return;

    // pos is a string e.g.: 0-0-1, each number is a position in a tree level
    const posFromArray = dragNode.pos.split('-');
    const posToArray = node.pos.split('-');

    // If not in the same cellClass, ignore
    if (!_.isEqual(posFromArray[1], posToArray[1])) return;

    const sameLevel = (posFromArray.length === posToArray.length);

    // dragOver is true for positions where dropToGap is false
    const addDragOverPosition = node.dragOver ? 1 : 0;

    const numberOfClusters = treeData[posFromArray[1]].children.length;

    const fromPosition = parseInt(posFromArray[2], 10);

    // dropPosition is not set correctly for first and last position, set manually instead
    let toPosition;

    // if dropped in first position
    if (!sameLevel && !dropToGap) {
      toPosition = 0;
      // if dropped in last position
    } else if (!sameLevel && dropToGap) {
      toPosition = numberOfClusters;
    } else {
      toPosition = dropPosition;
    }

    // If was dropped in same place, ignore
    if (fromPosition === toPosition) return;

    // if dropping below the initial position subtract 1, if dropping to secondary position add 1
    const newPosition = toPosition - (fromPosition < toPosition ? 1 : 0) + (!sameLevel ? 0 : addDragOverPosition);

    onCellSetReorder(dragNode.key, newPosition);
  }, [treeData]);

  const renderColorPicker = (modified) => {
    if (modified.color) {
      return (
        <ColorPicker
          color={modified.color || '#ffffff'}
          onColorChange={(e) => {
            onNodeUpdate(modified.key, { color: e });
          }}
        />
      );
    }
    return <></>;
  };

  const renderEditableField = (modified, parentKey, parentType) => (
    <EditableField
      onAfterSubmit={(e) => {
        onNodeUpdate(modified.key, { name: e });
      }}
      onDelete={() => {
        onNodeDelete(modified.key, modified.rootNode);
      }}
      value={modified.name}
      showEdit={modified.key !== 'scratchpad'}
      deleteEnabled={!(

        // Disable delete for root node if
        modified.type === 'metadataCategorical'
        || ['louvain', 'scratchpad', 'sample'].includes(modified.key)

        // Disable delete for child node if
        || (parentType && parentType === 'metadataCategorical')
        || (parentKey && parentKey !== 'scratchpad')
      )}
      renderBold={!!modified.rootNode}
    />
  );

  const renderFocusButton = (modified) => {
    if (modified.children && store) {
      return (
        <FocusButton
          experimentId={experimentId}
          lookupKey={modified.key}
          store={store}
        />
      );
    }

    return <></>;
  };

  const renderHideButton = (modified) => {
    if (!modified.rootNode && showHideButton) {
      return (
        <HideButton cellSetKey={modified.key} />
      );
    }

    return <></>;
  };

  const renderTitlesRecursive = (source, parentKey = null, parentType = null) => {
    const toRender = source && source.map((d) => {
      const modified = d;
      modified.title = (
        <Space>
          {renderFocusButton(modified)}
          {renderEditableField(modified, parentKey, parentType)}
          {renderColorPicker(modified)}
          {renderHideButton(modified)}
        </Space>
      );

      modified.selectable = false;

      if (modified.children) {
        modified.children = renderTitlesRecursive(modified.children, modified.key, modified.type);
      }

      return modified;
    });

    return toRender;
  };

  const [renderedTreeData, setRenderedTreeData] = useState([]);
  useEffect(() => {
    if (!treeData) {
      return;
    }

    if (shouldExpandKeys) {
      setExpandedKeys(treeData.map((n) => n.key));
    }

    setRenderedTreeData(renderTitlesRecursive(treeData));
  }, [treeData]);

  if (!treeData) return <Skeleton active />;

  return (
    <Tree
      checkable
      draggable
      onExpand={(keys) => {
        setExpandedKeys(keys);
      }}
      expandedKeys={expandedKeys}
      onCheck={onCheck}
      treeData={renderedTreeData}
      checkedKeys={checkedKeys}
      onDrop={onDrop}
      switcherIcon={<DownOutlined />}
      defaultExpandAll
    />
  );
};

HierarchicalTree.defaultProps = {
  onCheck: () => null,
  onNodeUpdate: () => null,
  onNodeDelete: () => null,
  onCellSetReorder: () => null,
  defaultCheckedKeys: [],
  store: null,
  showHideButton: false,
  shouldExpandKeys: false,
};

HierarchicalTree.propTypes = {
  onCheck: PropTypes.func,
  onNodeUpdate: PropTypes.func,
  onNodeDelete: PropTypes.func,
  onCellSetReorder: PropTypes.func,
  defaultCheckedKeys: PropTypes.array,
  treeData: PropTypes.array.isRequired,
  store: PropTypes.string,
  experimentId: PropTypes.string.isRequired,
  showHideButton: PropTypes.bool,
  shouldExpandKeys: PropTypes.bool,
};

export default HierarchicalTree;
