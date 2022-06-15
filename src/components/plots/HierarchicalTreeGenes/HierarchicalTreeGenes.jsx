import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Tree, Skeleton,
} from 'antd';

const HierarchicalTreeGenes = (props) => {
  const {
    treeData,
    onGeneReorder,
  } = props;

  const onDrop = useCallback((info) => {
    const {
      dragNode, node, dropPosition, dropToGap,
    } = info;

    // pos is a string e.g.: 0-0-1, each number is a position in a tree level
    const posFromArray = dragNode.pos.split('-');
    const posToArray = node.pos.split('-');

    const fromPosition = parseInt(posFromArray[2], 10);

    // If not in the same cellClass, ignore
    // if (!_.isEqual(posFromArray[1], posToArray[1])) return;

    // If was dropped in same place, ignore
    if (fromPosition === dropPosition) return;

    // If not dropped in gap, ignore
    // (only allow dropToGap when the destination node is rootNode
    // because it can have children nodes)
    if (!dropToGap && !node.rootNode) return;

    const newPosition = dropPosition - (fromPosition < dropPosition ? 1 : 0);

    onGeneReorder(dragNode.key, newPosition);
  }, []);

  if (!treeData) return <Skeleton active />;

  return (
    <Tree
      draggable
      treeData={treeData}
      onDrop={onDrop}
    />
  );
};

HierarchicalTreeGenes.defaultProps = {};

HierarchicalTreeGenes.propTypes = {
  treeData: PropTypes.array.isRequired,
  onGeneReorder: PropTypes.func.isRequired,
};

export default HierarchicalTreeGenes;
