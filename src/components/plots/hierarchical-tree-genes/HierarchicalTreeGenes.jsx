import React from 'react';
import PropTypes from 'prop-types';
import { Tree, Skeleton } from 'antd';

import 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes.css';

const HierarchicalTreeGenes = (props) => {
  const {
    treeData,
    onGeneReorder,
  } = props;

  const onDrop = (info) => {
    const {
      dragNode, node, dropPosition,
    } = info;

    // if dropped in place, ignore
    // dragNode.key is str, dropPosition is int
    if (dragNode.key == dropPosition) return;

    // dragOver is true for positions where dropToGap is false
    const addDragOverPosition = node.dragOver ? 1 : 0;

    // if dropping below the initial position subtract 1, if dropping to secondary position add 1
    let newPosition = dropPosition - (dragNode.key < dropPosition ? 1 : 0) + addDragOverPosition;
    newPosition = Math.max(0, newPosition);

    onGeneReorder(dragNode.key, newPosition);
  };

  if (!treeData) return <Skeleton active />;

  return (
    // wrapping in div needed to not unload dragged element when scrolling
    // add padding to the tree to make first drop position visible
    <div className='scroll-wrapper' id='ScrollWrapper' style={{ overflowY: 'auto', maxHeight: '400px' }}>
      <Tree
        style={{ paddingTop: '6px', paddingBottom: '3px' }}
        data-testid='HierachicalTreeGenes'
        draggable
        treeData={treeData}
        onDrop={onDrop}
      />
    </div>
  );
};

HierarchicalTreeGenes.defaultProps = {};

HierarchicalTreeGenes.propTypes = {
  treeData: PropTypes.array.isRequired,
  onGeneReorder: PropTypes.func.isRequired,
};

export default HierarchicalTreeGenes;
