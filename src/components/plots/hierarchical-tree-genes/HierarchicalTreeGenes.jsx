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
      dragNode, dropPosition, dropToGap,
    } = info;

    // if dropped in place, ignore
    // dragNode.key is str, dropPosition is int
    if (dragNode.key == dropPosition) return;

    // If not dropped in gap, ignore
    if (!dropToGap) return;

    let newPosition = dropPosition - (dragNode.key < dropPosition ? 1 : 0);
    newPosition = Math.max(0, newPosition);

    onGeneReorder(dragNode.key, newPosition);
  };

  if (!treeData) return <Skeleton active />;

  return (
    // wrapping in div needed to not unload dragged element when scrolling
    <div id='ScrollWrapper' style={{ overflowY: 'scroll', maxHeight: '400px' }}>
      <Tree
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
