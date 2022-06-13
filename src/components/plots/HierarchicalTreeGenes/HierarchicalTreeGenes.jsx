import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Tree, Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import 'components/plots/HierarchicalTreeGenes/HierarchicalTreeGenes.css';
import { loadGeneExpression } from 'redux/actions/genes';

const HierarchicalTreeGenes = (props) => {
  const {
    treeData,
    experimentId,
    plotType,
  } = props;

  const dispatch = useDispatch();
  const displayedGenes = useSelector((state) => state.genes.expression?.views[plotType]?.data);

  const onGeneReorder = (geneKey, newPosition) => {
    const newOrder = Object.keys(displayedGenes);

    newOrder.splice(newPosition, 0, geneKey);

    // depending whether the inserted position was before or after the old position
    // then delete the old position
    if (geneKey < newPosition) {
      newOrder.splice(geneKey, 1);
    } else {
      newOrder.splice(geneKey + 1, 1);
    }

    const newGeneOrder = newOrder.map((i) => displayedGenes[i]);

    const newGenes = {};

    newGeneOrder.forEach((gene, i) => {
      newGenes[i] = gene;
    });

    console.log(newGeneOrder);

    dispatch(loadGeneExpression(experimentId, newGenes, plotType));
  };

  const onDrop = useCallback((info) => {
    const {
      dragNode, node, dropPosition, dropToGap,
    } = info;

    // pos is a string e.g.: 0-0-1, each number is a position in a tree level
    const posFromArray = dragNode.pos.split('-');
    const posToArray = node.pos.split('-');

    const fromPosition = parseInt(posFromArray[2], 10);

    // If not in the same cellClass, ignore
    if (!_.isEqual(posFromArray[1], posToArray[1])) return;

    // If was dropped in same place, ignore
    if (fromPosition === dropPosition) return;

    // If not dropped in gap, ignore
    // (only allow dropToGap when the destination node is rootNode
    // because it can have children nodes)
    if (!dropToGap && !node.rootNode) return;

    const newPosition = dropPosition - (fromPosition < dropPosition ? 1 : 0);

    onGeneReorder(dragNode.key, newPosition);
    console.log("Test")
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
  experimentId: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
};

export default HierarchicalTreeGenes;
