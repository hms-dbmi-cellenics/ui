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
  Radio,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { arrayMoveImmutable } from 'utils/array-move';
import HierarchicalTreeGenes from 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes';
import GeneSearchBar from 'components/plots/GeneSearchBar';

const MultiViewEditor = (props) => {
  const {
    multiViewConfig,
    addGeneToMultiView,
    updateAll,
    setUpdateAll,
    onMultiViewUpdate,
    selectedPlotUuid,
    setSelectedPlotUuid,
    shownGenes,
  } = props;

  const [localNRows, setLocalNRows] = useState(null);
  const [localNCols, setLocalNCols] = useState(null);
  const [options, setOptions] = useState([]);

  const renderUuidOptions = (plotUuids) => {
    if (!plotUuids) return [];

    return plotUuids.map((plotUuid, index) => {
      const row = Math.floor(index / localNCols) + 1;
      const col = (index % localNCols) + 1;
      return { label: `${row}.${col} ${shownGenes[index]}`, value: plotUuid };
    });
  };

  useEffect(() => {
    if (!multiViewConfig) return;

    if (localNRows !== multiViewConfig.nrows) {
      setLocalNRows(multiViewConfig.nrows);
    }

    if (localNCols !== multiViewConfig.ncols) {
      setLocalNCols(multiViewConfig.ncols);
    }
  }, [multiViewConfig]);

  useEffect(() => {
    if (!multiViewConfig || !localNRows || !localNCols) return;

    if (!_.isEqual((options.map((option) => option?.value)), multiViewConfig.plotUuids)
      || !options.every((option, i) => option?.label.includes(shownGenes[i]))) {
      setOptions(renderUuidOptions(multiViewConfig.plotUuids));
    }
  }, [multiViewConfig, shownGenes, localNRows, localNCols]);

  if (!multiViewConfig) {
    return (
      <div data-testid='skeletonInput'>
        <Skeleton.Input style={{ width: 200 }} active />
      </div>
    );
  }

  const onGeneReorder = (index, newPosition) => {
    const newPlotUuids = arrayMoveImmutable(multiViewConfig.plotUuids, index, newPosition);

    onMultiViewUpdate({ plotUuids: newPlotUuids });
  };

  const onNodeDelete = (index) => {
    const newPlotUuids = [...multiViewConfig.plotUuids];
    _.pullAt(newPlotUuids, index);

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
        onSelect={addGeneToMultiView}
      />
      <Space>
        Selected plot:
        <Select
          aria-label='selectPlot'
          value={selectedPlotUuid}
          options={options}
          onChange={(value) => setSelectedPlotUuid(value)}
        />
      </Space>
      <Space>
        Controls update:
        <Radio.Group
          onChange={(e) => setUpdateAll(e.target.value)}
          value={updateAll}
        >
          <Radio value={false}>Selected plot</Radio>
          <Radio
            // eslint-disable-next-line react/jsx-boolean-value
            value={true}
          >
            All plots
          </Radio>
        </Radio.Group>
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
  updateAll: PropTypes.bool.isRequired,
  setUpdateAll: PropTypes.func.isRequired,
  onMultiViewUpdate: PropTypes.func.isRequired,
  selectedPlotUuid: PropTypes.string.isRequired,
  setSelectedPlotUuid: PropTypes.func.isRequired,
  shownGenes: PropTypes.array.isRequired,
};

MultiViewEditor.defaultProps = {
  multiViewConfig: null,
};

export default MultiViewEditor;
