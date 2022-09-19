import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Skeleton,
  Space,
  Select,
  Input,
  Button,
  Row,
  Col,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { arrayMoveImmutable } from 'utils/array-move';
import HierarchicalTreeGenes from '../hierarchical-tree-genes/HierarchicalTreeGenes';

const { Search } = Input;

const MultiViewEditor = (props) => {
  const {
    multiViewConfig,
    addGeneToMultiView,
    onMultiViewUpdate,
    setSelectedPlot,
  } = props;

  if (!multiViewConfig) {
    return (
      <div data-testid='skeletonInput'>
        <Skeleton.Input style={{ width: 200 }} active />
      </div>
    );
  }

  const [localShownGene, setLocalShownGene] = useState('');
  const [localNRows, setLocalNRows] = useState(multiViewConfig.nrows);
  const [localNCols, setLocalNCols] = useState(multiViewConfig.ncols);

  const options = multiViewConfig.plotUuids.map((plotUuid) => ({ value: plotUuid }));

  const onGeneReorder = (key, newPosition) => {
    const newPlotUuids = arrayMoveImmutable(multiViewConfig.plotUuids, key, newPosition);

    onMultiViewUpdate({ plotUuids: newPlotUuids });
  };

  const onSearch = (value) => {
    addGeneToMultiView(value);
    setLocalShownGene('');
  };

  const onNodeDelete = (key) => {
    const newPlotUuids = multiViewConfig.plotUuids.slice();
    newPlotUuids.splice(key, 1);

    onMultiViewUpdate({ plotUuids: newPlotUuids });
  };

  const onRowsChange = (value) => {
    setLocalNRows(value);

    if (value) onMultiViewUpdate({ nrows: value });
  };

  const onColsChange = (value) => {
    setLocalNCols(value);

    if (value) onMultiViewUpdate({ ncols: value });
  }

  const hideDeleteButton = (multiViewConfig.genes.length === 1);
  const renderTitle = (gene, key) => (
    <Space>
      {gene}
      <Button
        type='text'
        hidden={hideDeleteButton}
        onClick={() => {
          onNodeDelete(key);
        }}
      >
        <CloseOutlined />
      </Button>
    </Space>
  );

  const treeData = multiViewConfig.genes.map((gene, index) => (
    { key: index, title: renderTitle(gene, index) }
  ));

  return (
    <Space direction='vertical'>
      <Search
        aria-label='addMultiViewGene'
        style={{ width: '100%' }}
        enterButton='Add'
        value={localShownGene}
        onChange={(e) => { setLocalShownGene(e.target.value); }}
        onSearch={(value) => onSearch(value)}
      />
      <Space>
        Selected plot:
        <Select
          aria-label='selectPlot'
          defaultValue={options[0].value}
          options={options}
          onChange={(value) => setSelectedPlot(value)}
        />
      </Space>
      <Row justify='space-evenly' align='middle'>
        <Col span={7}>
          Grid dimesions:
        </Col>
        <Col span={3}>
          <Input
            aria-label='setNRows'
            value={localNRows}
            onChange={(e) => { onRowsChange(e.target.value); }}
          />
        </Col>
        <Col span={2}>
          <center>
            x
          </center>
        </Col>
        <Col span={3}>
          <Input
            aria-label='setNCols'
            value={localNCols}
            onChange={(e) => { onColsChange(e.target.value); }}
          />
        </Col>
      </Row>
      <HierarchicalTreeGenes
        treeData={treeData}
        onGeneReorder={onGeneReorder}
      />
    </Space>
  );
};

MultiViewEditor.propTypes = {
  multiViewConfig: PropTypes.object.isRequired,
  addGeneToMultiView: PropTypes.func.isRequired,
  onMultiViewUpdate: PropTypes.func.isRequired,
  setSelectedPlot: PropTypes.func.isRequired,
};

export default MultiViewEditor;
