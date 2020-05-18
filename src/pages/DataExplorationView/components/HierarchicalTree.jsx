import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Space, Tree } from 'antd';
import { transform, cloneDeep } from 'lodash';
import EditableField from '../../../components/EditableField';
import ColorPicker from '../../../components/color-picker/ColorPicker';


const HierarchicalTree = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const [treeData, setTreeData] = useState(props.data);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const onExpand = () => {
    setAutoExpandParent(false);
  };

  const onCheck = (keys) => { console.log('i am inside hierarchical tree'); props.onCheck(keys); };

  const onSelect = (keys) => { props.onSelect(keys); };

  const onDrop = (info) => {
    /**
     * The `key` values in the data array passed to the <Tree/> component
     * which was dragged, and which was dropped. dropKey can either be
     * the item above or the item below the gap, if it was dropped into a
     * gap between two items, depending on the precise position where
     * you drop the item. The relative positions are specified in
     * `info.node.dragOverGapTop` and `info.node.dragOverGapBottom`.
     */
    const dragKey = info.dragNode.props.eventKey;
    const dropKey = info.node.props.eventKey;

    /**
     * Variable to determine if the state should be set to the new one.
     * If we encounter an illegal drop, we will not update the state
     * of the component.
     */
    let shouldUpdateState = true;

    /**
     *  Find `needle`, a key in a recursively defined `haystack`, where
     * `children` is a dictionary of child elements.
     */
    const removeAndReturn = (haystack, needle) => {
      let removed;

      const rest = transform(haystack, (result, objValue) => {
        if (objValue.key !== needle) {
          if (objValue.children) {
            const recReturn = removeAndReturn(objValue.children, needle);

            // eslint-disable-next-line no-param-reassign
            objValue.children = recReturn.rest;
            if (recReturn.removed) {
              removed = recReturn.removed;
            }
          }
          result.push(objValue);
        } else {
          removed = objValue;
        }
      }, []);

      return { removed, rest };
    };

    // Clone the state of the curernt tree
    // eslint-disable-next-line prefer-const
    let { removed: dragObj, rest: newTreeData } = removeAndReturn(cloneDeep(treeData), dragKey);

    /**
     * We dropped the item into another item. At this point we want to
     * make sure the item we drag is not a root node, and the item we
     * drop it into is a root node.
     */
    if (!info.dropToGap) {
      const addToChildren = (searchData, key) => {
        searchData.forEach((element) => {
          if (element.key === key) {
            if (dragObj.rootNode === true || !element.rootNode) {
              shouldUpdateState = false;
            } else {
              // eslint-disable-next-line no-param-reassign
              element.children = element.children || [];
              element.children.push(dragObj);
            }
          }

          if (element.children) {
            addToChildren(element.children, key);
          }
        });
      };

      addToChildren(newTreeData, dropKey);
    }

    // We dropped the item into a gap between two items.
    if (info.dropToGap) {
      // It can either be above or below an element.
      const dropPosition = (info.node.dragOverGapTop) ? 'top' : 'bottom';

      const addIntoGap = (haystack, needle) => transform(haystack,
        (result, objValue) => {
          // We found the place to insert the dragged element.
          if (objValue.key === needle) {
            /**
             * If a dragged object is a root node, it should only be
             * droppable in between root nodes.
             */
            if (!objValue.rootNode && dragObj.rootNode === true) {
              shouldUpdateState = false;
              return false;
            }

            /**
             * If a dragged object is not a root node, it should only be
             * droppable in between non-root nodes.
             */
            if (!dragObj.rootNode && objValue.rootNode === true) {
              shouldUpdateState = false;
              return false;
            }

            if (objValue.children) {
              // eslint-disable-next-line no-param-reassign
              objValue.children = addIntoGap(objValue.children, needle);
            }

            /**
             * Add the drag object into the tree according to where it was
             * dropped.
             */
            if (dropPosition === 'top') {
              result.push(dragObj);
              result.push(objValue);
            } else {
              result.push(objValue);
              result.push(dragObj);
            }
          } else {
            /**
             * We have not found the place to insert the element.
             * Carry on building the new object until we are there.
             */
            if (objValue.children) {
              // eslint-disable-next-line no-param-reassign
              objValue.children = addIntoGap(objValue.children, needle);
            }
            result.push(objValue);
          }

          return true;
        }, []);

      newTreeData = addIntoGap(newTreeData, dropKey);
    }

    if (shouldUpdateState) {
      setTreeData(newTreeData);
      props.onTreeUpdate(treeData);
    }
  };

  const findAndUpdateTreeDataState = (haystack, needle, newState) => {
    const updated = haystack.map((d) => {
      let modified = d;

      if (modified.key === needle) {
        modified = { ...modified, ...newState };
      }

      if (modified.children) {
        modified.children = findAndUpdateTreeDataState(modified.children, needle, newState);
      }

      return modified;
    });

    return updated;
  };

  const renderTitlesRecursive = (source) => {
    const toRender = source.map((d) => {
      const modified = d;

      const renderColorPicker = () => {
        if (modified.color) {
          return (
            <ColorPicker
              color={modified.color || '#ffffff'}
              onColorChange={((e) => {
                const newState = findAndUpdateTreeDataState(treeData, modified.key, { color: e });
                setTreeData(newState);
                props.onTreeUpdate(newState);
              })}
            />
          );
        }
        return (<></>);
      };

      const renderEditableField = () => (
        <EditableField
          defaultText={modified.name}
          onEdit={(e) => {
            const newState = findAndUpdateTreeDataState(treeData, modified.key, { name: e });
            setTreeData(newState);
            props.onTreeUpdate(newState);
          }}
        >
          {modified.name}
        </EditableField>
      );

      modified.title = (
        <Space>
          {renderEditableField()}
          {renderColorPicker()}
        </Space>
      );

      if (modified.children) {
        modified.children = renderTitlesRecursive(modified.children);
      }

      return modified;
    });

    return toRender;
  };

  const treeDataToRender = renderTitlesRecursive(treeData);

  return (
    <Tree
      checkable
      draggable
      onExpand={onExpand}
      autoExpandParent={autoExpandParent}
      onCheck={onCheck}
      onSelect={onSelect}
      treeData={treeDataToRender}
      onDrop={onDrop}
    />
  );
};

HierarchicalTree.defaultProps = {
  onCheck: () => null,
  onSelect: () => null,
  onTreeUpdate: () => null,
};

HierarchicalTree.propTypes = {
  data: PropTypes.arrayOf(Object).isRequired,
  onCheck: PropTypes.func,
  onSelect: PropTypes.func,
  onTreeUpdate: PropTypes.func,
};

export default HierarchicalTree;
