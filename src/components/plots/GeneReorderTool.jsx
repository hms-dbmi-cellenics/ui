import React, {
  useCallback, useEffect, useState,
} from 'react';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { updatePlotConfig } from 'redux/actions/componentConfig';

import { arrayMoveImmutable } from 'utils/array-move';
import HierarchicalTreeGenes from 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes';

import { Space, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const GeneReorderTool = (props) => {
  const { plotUuid, onDelete } = props;

  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const genesLoading = useSelector((state) => state.genes.expression.loading);

  const [selectedGenesLocal, setSelectedGenesLocal] = useState([]);

  useEffect(() => {
    setSelectedGenesLocal(config?.selectedGenes);
  }, [config?.selectedGenes]);

  const debouncedOnDelete = useCallback(_.debounce((newGenes) => {
    onDelete(newGenes);
  }, 1000), []);

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
  // dispatches an action to update selectedGenes in config
  const onGeneReorder = (geneKey, newPosition) => {
    const oldOrder = geneTreeData.map((treeNode) => treeNode.title);

    const newOrder = arrayMoveImmutable(Object.values(oldOrder), geneKey, newPosition);

    dispatch(updatePlotConfig(plotUuid, { selectedGenes: newOrder }));
  };

  const onNodeDelete = (geneKey) => {
    const genes = [...geneTreeData.map((treeNode) => treeNode.title)];
    genes.splice(geneKey, 1);

    setSelectedGenesLocal(genes);

    debouncedOnDelete(genes);
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
            disabled={genesLoading.length > 0}
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
  }, [geneTreeData, genesLoading]);

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
  onDelete: PropTypes.func.isRequired,
};

export default GeneReorderTool;
