import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Tree, Skeleton, Button, Space,
} from 'antd';

import { CloseOutlined } from '@ant-design/icons';

import 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes.css';

const HierarchicalTreeGenes = (props) => {
  const {
    treeData,
    onGeneReorder,
    onNodeDelete,
  } = props;

  const onDrop = (info) => {
    const {
      dragNode, node, dropPosition, dropToGap,
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

  const renderXButton = (geneKey) => (
    <Button
      type='text'
      onClick={() => {
        onNodeDelete(geneKey);
      }}
    >
      <CloseOutlined />
    </Button>
  );

  const renderTitles = (data) => {
    const toRender = data.map((e) => {
      // modified needs to be a copy of a given gene
      const modified = { ...e };
      modified.title = (
        <Space>
          {modified.title}
          {renderXButton(modified.key)}
        </Space>
      );
      return modified;
    });
    return toRender;
  };

  const [renderedTreeData, setRenderedTreeData] = useState([]);

  useEffect(() => {
    setRenderedTreeData(renderTitles(treeData));
  }, [treeData]);

  if (!treeData) return <Skeleton active />;

  return (
    <Tree
      draggable
      treeData={renderedTreeData}
      onDrop={onDrop}
    />
  );
};

HierarchicalTreeGenes.defaultProps = {};

HierarchicalTreeGenes.propTypes = {
  treeData: PropTypes.array.isRequired,
  onGeneReorder: PropTypes.func.isRequired,
  onNodeDelete: PropTypes.func.isRequired,
};

export default HierarchicalTreeGenes;
