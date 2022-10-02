import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Skeleton,
  Space,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { arrayMoveImmutable } from 'utils/array-move';
import HierarchicalTreeGenes from 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes';
import GeneSearchBar from 'components/plots/GeneSearchBar';

const MultiViewEditor = (props) => {
  const {
    multiViewConfig,
    addGeneToMultiView,
    onMultiViewUpdate,
    setSelectedPlot,
    shownGenes,
  } = props;

  if (!multiViewConfig) {
    return (
      <div data-testid='skeletonInput'>
        <Skeleton.Input style={{ width: 200 }} active />
      </div>
    );
  }

  const renderUuidOptions = (plotUuids) => {
    return plotUuids.map((plotUuid, index) => {
      const row = Math.floor(index / localNCols) + 1;
      const col = (index % localNCols) + 1;
      return { label: `${row}.${col} ${shownGenes[index]}`, value: plotUuid };
    });
  };

  const [localNRows, setLocalNRows] = useState(multiViewConfig.nrows);
  const [localNCols, setLocalNCols] = useState(multiViewConfig.ncols);
  const [options, setOptions] = useState(
    renderUuidOptions(multiViewConfig.plotUuids),
  );
  const [localSelectedPlot, setLocalSelectedPlot] = useState(multiViewConfig.plotUuids[0]);

  useEffect(() => {
    if (localNRows !== multiViewConfig.nrows) {
      setLocalNRows(multiViewConfig.nrows);
    }

    if (localNCols !== multiViewConfig.ncols) {
      setLocalNCols(multiViewConfig.ncols);
    }

    if (_.isEqual((options.map((option) => option.value)), multiViewConfig.plotUuids)) {
      setOptions(renderUuidOptions(multiViewConfig.plotUuids));
    }
  }, [multiViewConfig]);

  const onGeneReorder = (index, newPosition) => {
    const newPlotUuids = arrayMoveImmutable(multiViewConfig.plotUuids, index, newPosition);

    onMultiViewUpdate({ plotUuids: newPlotUuids });
  };

  const onSelectedPlotChange = (value) => {
    setLocalSelectedPlot(value);
    setSelectedPlot(value);
  };

  const onNodeDelete = (index) => {
    const newPlotUuids = [...multiViewConfig.plotUuids];
    _.pullAt(newPlotUuids, index);

    // if selected plot is deleted, change the selection
    if (multiViewConfig.plotUuids[index] === localSelectedPlot) {
      const newIndexToSelect = index === 0 ? 1 : 0;
      const newPlotToselect = multiViewConfig.plotUuids[newIndexToSelect];
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

  const hideDeleteButton = (shownGenes.length === 1);
  const renderTitle = (gene, index) => {
    const row = Math.floor(index / localNCols) + 1;
    const col = (index % localNCols) + 1;
    return (
      <Space>
        {`${row}.${col} ${gene}`}
        <Button
          type='text'
          hidden={hideDeleteButton}
          onClick={() => {
            onNodeDelete(index);
          }}
        >
          <CloseOutlined />
        </Button>
      </Space>
    );
  };

  const treeData = shownGenes.map((gene, index) => (
    { key: index, title: renderTitle(gene, index) }
  ));

  return (
    <Space direction='vertical'>
      <GeneSearchBar
        aria-label='addMultiViewGene'
        onSelect={addGeneToMultiView}
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
          <InputNumber
            aria-label='setNRows'
            style={{ width: '100%' }}
            controls={false}
            min={1}
            max={30}
            value={localNRows}
            onChange={(value) => { onRowsChange(value); }}
          />
        </Col>
        <Col span={2}>
          <center>
            x
          </center>
        </Col>
        <Col span={3}>
          <InputNumber
            aria-label='setNCols'
            style={{ width: '100%' }}
            controls={false}
            min={1}
            max={30}
            value={localNCols}
            onChange={(value) => { onColsChange(value); }}
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
  shownGenes: PropTypes.array.isRequired,
};

MultiViewEditor.defaultProps = {
  multiViewConfig: null,
};

export default MultiViewEditor;
