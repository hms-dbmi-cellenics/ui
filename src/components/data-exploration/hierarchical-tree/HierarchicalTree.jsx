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
    onNodeUpdate: propOnNodeUpdate,
    defaultCheckedKeys: propDefaultCheckedKeys,
    treeData,
    store,
    experimentId,
    showHideButton,
    onCellSetReorder,
    ...restOfProps
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

    // pos is a string e.g.: 0-0-1, each number is a position in a tree level
    const posFromArray = dragNode.pos.split('-');
    const posToArray = node.pos.split('-');

    const fromPosition = parseInt(posFromArray[2], 10);

    // If not in the same cellClass, ignore
    if (!_.isEqual(posFromArray[1], posToArray[1])) return;

    // If was dropped in same place, ignore
    if (fromPosition === dropPosition) return;

    // If not dropped in gap, ignore
    if (!dropToGap && !node.rootNode) return;

    const newPosition = dropPosition - (fromPosition < dropPosition ? 1 : 0);

    onCellSetReorder(dragNode.key, newPosition);
  }, []);

  const renderColorPicker = (modified) => {
    if (modified.color) {
      return (
        <ColorPicker
          color={modified.color || '#ffffff'}
          onColorChange={(e) => {
            props.onNodeUpdate(modified.key, { color: e });
          }}
        />
      );
    }
    return <></>;
  };

  const renderEditableField = (modified, parentKey) => (
    <EditableField
      onAfterSubmit={(e) => {
        props.onNodeUpdate(modified.key, { name: e });
      }}
      onDelete={() => {
        props.onNodeDelete(modified.key);
      }}
      value={modified.name}
      showEdit={modified.key !== 'scratchpad'}
      deleteEnabled={parentKey === 'scratchpad'}
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
        <HideButton
          experimentId={experimentId}
          cellSetKey={modified.key}
        />
      );
    }

    return <></>;
  };

  const renderTitlesRecursive = (source, parentKey = null) => {
    const toRender = source && source.map((d) => {
      const modified = d;
      modified.title = (
        <Space>
          {renderFocusButton(modified)}
          {renderEditableField(modified, parentKey)}
          {renderColorPicker(modified)}
          {renderHideButton(modified)}
        </Space>
      );

      modified.selectable = false;

      if (modified.children) {
        modified.children = renderTitlesRecursive(modified.children, modified.key);
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

    setExpandedKeys(treeData.map((n) => n.key));
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
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restOfProps}
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
};

export default HierarchicalTree;
