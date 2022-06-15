import React, {
  useEffect, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { arrayMoveImmutable } from 'utils/array-move';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import HierarchicalTreeGenes from '../hierarchical-tree-genes/HierarchicalTreeGenes';

const GeneReorderTool = (props) => {
  const { plotUuid } = (props);

  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const loadedMarkerGenes = useSelector(
    (state) => state.genes.expression.views[plotUuid]?.data,
  ) || [];

  // Tree from antd requires format [{key: , title: }], made from gene names from loadedMarkerGenes and config
  const composeGeneTree = (treeGenes) => {
    if (!treeGenes) {
      return [];
    }

    const data = [];
    Object.entries(treeGenes).forEach(([key, value]) => {
      data.push({ key: `${key}`, title: `${value}` });
    });
    return data;
  };

  const [geneTreeData, setGeneTreeData] = useState(composeGeneTree(loadedMarkerGenes));

  useEffect(() => {
    setGeneTreeData(composeGeneTree(config?.selectedGenes));
  }, [config?.selectedGenes]);

  // geneKey is equivalent to it's index, moves a gene from pos geneKey to newPosition
  // dispatches an action to update selectedGenes in config
  const onGeneReorder = (geneKey, newPosition) => {
    const oldOrder = geneTreeData.map((treeNode) => treeNode.title);

    const newOrder = arrayMoveImmutable(Object.values(oldOrder), geneKey, newPosition);

    dispatch(updatePlotConfig(plotUuid, { selectedGenes: newOrder }));
  };

  return (
    <>
      <HierarchicalTreeGenes
        treeData={geneTreeData}
        onGeneReorder={onGeneReorder}
      />
    </>
  );
};

GeneReorderTool.defaultProps = {};

GeneReorderTool.propTypes = {
  plotUuid: PropTypes.string.isRequired,
};

export default GeneReorderTool;
