import React, {
  useEffect, useState,
} from 'react';

import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { updatePlotConfig } from 'redux/actions/componentConfig';

import { arrayMoveImmutable } from 'utils/arrayUtils';
import HierarchicalTreeGenes from 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes';

import { Space, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const GeneReorderTool = (props) => {
  const { plotUuid, onDelete, onReorder } = props;

  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  // Read selectedGenes from the consolidated location in genes.expression.views
  const selectedGenes = useSelector((state) => state.genes.expression.views[plotUuid]?.data) || [];

  const [selectedGenesLocal, setSelectedGenesLocal] = useState([]);

  useEffect(() => {
    setSelectedGenesLocal(selectedGenes);
  }, [selectedGenes]);

  // Tree from antd requires format [{key: , title: }],
  // made from gene names from loadedMarkerGenes and config
  const composeGeneTree = (treeGenes) => {
    if (!treeGenes.length) {
      return [];
    }

    const data = [];
    Object.entries(treeGenes).forEach(([key, value]) => {
      data.push({ key: `${key}`, title: `${value}` });
    });
    return data;
  };

  const [geneTreeData, setGeneTreeData] = useState([]);

  useEffect(() => {
    setGeneTreeData(composeGeneTree(selectedGenesLocal));
  }, [selectedGenesLocal]);

  // geneKey is equivalent to it's index, moves a gene from pos geneKey to newPosition
  // Triggers UI update via onReorder callback (which updates genes.expression.views)
  const onGeneReorder = (geneKey, newPosition) => {
    const oldOrder = geneTreeData.map((treeNode) => treeNode.title);

    const newOrder = arrayMoveImmutable(Object.values(oldOrder), geneKey, newPosition);

    // Call the callback to update genes.expression.views (the actual displayed genes location)
    // The marker-heatmap sync effect will then update config.selectedGenes
    if (onReorder) {
      onReorder(newOrder);
    }
  };

  const onNodeDelete = (geneKey) => {
    const genes = [...geneTreeData.map((treeNode) => treeNode.title)];
    genes.splice(geneKey, 1);

    setSelectedGenesLocal(genes);

    dispatch(updatePlotConfig(plotUuid, { selectedGenes: genes }));

    onDelete(genes);
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

GeneReorderTool.defaultProps = {
  onReorder: null,
};

GeneReorderTool.propTypes = {
  plotUuid: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReorder: PropTypes.func,
};

export default GeneReorderTool;
