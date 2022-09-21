import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (localNRows !== multiViewConfig.nrows) {
      setLocalNRows(multiViewConfig.nrows);
    }

    if (localNCols !== multiViewConfig.ncols) {
      setLocalNCols(multiViewConfig.ncols);
    }
  }, [multiViewConfig]);

  const options = multiViewConfig.plotUuids.map((plotUuid, index) => {
    const row = Math.floor(index / localNCols) + 1;
    const col = (index % localNCols) + 1;
    return { label: `${row}.${col} ${multiViewConfig.genes[index]}`, value: plotUuid };
  });

  const [localSelectedPlot, setLocalSelectedPlot] = useState(options[0].value);

  const onGeneReorder = (key, newPosition) => {
    const newPlotUuids = arrayMoveImmutable(multiViewConfig.plotUuids, key, newPosition);
    const newGenes = arrayMoveImmutable(multiViewConfig.genes, key, newPosition);

    onMultiViewUpdate({ genes: newGenes, plotUuids: newPlotUuids });
  };

  const onSearch = (value) => {
    addGeneToMultiView(value);
    setLocalShownGene('');
  };

  const onSelectedPlotChange = (value) => {
    setLocalSelectedPlot(value);
    setSelectedPlot(value);
  };

  const onNodeDelete = (key) => {
    const newPlotUuids = multiViewConfig.plotUuids.slice();
    newPlotUuids.splice(key, 1);

    if (multiViewConfig.plotUuids[key] === localSelectedPlot) {
      const newIndexToSelect = key === 0 ? 1 : 0;
      const newPlotToselect = options[newIndexToSelect].value;
      setLocalSelectedPlot(newPlotToselect);
      setSelectedPlot(newPlotToselect);
    }

    onMultiViewUpdate({ plotUuids: newPlotUuids });
  };

  const onRowsChange = (value) => {
    setLocalNRows(value);

    if (value) onMultiViewUpdate({ nrows: value });
  };

  const onColsChange = (value) => {
    setLocalNCols(value);

    if (value) onMultiViewUpdate({ ncols: value });
  };

  const hideDeleteButton = (multiViewConfig.genes.length === 1);
  const renderTitle = (gene, key) => {
    const row = Math.floor(key / localNCols) + 1;
    const col = (key % localNCols) + 1;
    return (
      <Space>
        {`${row}.${col} ${gene}`}
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
  };

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
          value={localSelectedPlot}
          options={options}
          onChange={(value) => onSelectedPlotChange(value)}
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
  multiViewConfig: PropTypes.object,
  addGeneToMultiView: PropTypes.func.isRequired,
  onMultiViewUpdate: PropTypes.func.isRequired,
  setSelectedPlot: PropTypes.func.isRequired,
};

MultiViewEditor.defaultProps = {
  multiViewConfig: null,
};

export default MultiViewEditor;
