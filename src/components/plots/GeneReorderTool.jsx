import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { arrayMoveImmutable } from 'utils/array-move';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import { loadGeneExpression } from 'redux/actions/genes';
import HierarchicalTreeGenes from 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes';

import { Space, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const GeneReorderTool = (props) => {
  const { plotUuid } = (props);

  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const experimentId = useSelector((state) => state.componentConfig[plotUuid]?.experimentId);

  const loadedMarkerGenes = useSelector(
    (state) => state.genes.expression.views[plotUuid]?.data,
  );

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

  const onNodeDelete = (geneKey) => {
    const genes = geneTreeData.map((treeNode) => treeNode.title);
    genes.splice(geneKey, 1);

    dispatch(loadGeneExpression(experimentId, genes, plotUuid));
  };

  const renderTitles = (data) => {
    // replace every title (gene name) in tree data with a modified title (name + button)
    const toRender = data.map((treeNode) => {
      // modified needs to be a copy of a given node
      const modified = { ...treeNode };
      modified.title = (
        <Space>
          {treeNode.title}
          <Button
            type='text'
            onClick={() => {
              onNodeDelete(treeNode.key);
            }}
          >
            <CloseOutlined />
          </Button>
        </Space>
      );
      return modified;
    });
    return toRender;
  };

  const [renderedTreeData, setRenderedTreeData] = useState([]);

  useEffect(() => {
    setRenderedTreeData(renderTitles(geneTreeData));
  }, [geneTreeData]);

  return (
    <HierarchicalTreeGenes
      treeData={renderedTreeData}
      onGeneReorder={onGeneReorder}
      onNodeDelete={onNodeDelete}
    />
  );
};

GeneReorderTool.defaultProps = {};

GeneReorderTool.propTypes = {
  plotUuid: PropTypes.string.isRequired,
};

export default GeneReorderTool;
