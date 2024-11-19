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
  Form,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { arrayMoveImmutable } from 'utils/arrayUtils';
import HierarchicalTreeGenes from 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes';
import { useDispatch, useSelector } from 'react-redux';
import { getPlotConfigs } from 'redux/selectors';
import {
  updatePlotConfig,
} from 'redux/actions/componentConfig/index';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';
import { plotUuids } from 'utils/constants';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';

const MultiViewPlotEditor = (props) => {
  const {
    experimentId,
    plotType,
    plotUuid,
    selectedPlotUuid, setSelectedPlotUuid,
    updateAll, setUpdateAll,
  } = props;
  const dispatch = useDispatch();
  const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);
  const [localNRows, setLocalNRows] = useState(null);
  const [localNCols, setLocalNCols] = useState(null);
  const [options, setOptions] = useState([]);
  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const plotConfigs = useSelector(getPlotConfigs(multiViewConfig?.plotUuids));

  console.log('plotConfigs!!!');
  console.log(plotConfigs);

  const selectedConfig = plotConfigs[selectedPlotUuid];

  const renderUuidOptions = (uuids) => {
    if (!uuids) return [];

    return uuids.map((uuid, index) => {
      const row = Math.floor(index / localNCols) + 1;
      const col = (index % localNCols) + 1;
      return { label: `${row}.${col}`, value: uuid };
    });
  };

  const updateMultiViewWithChanges = (updateField) => {
    dispatch(updatePlotConfig(multiViewUuid, updateField));
  };

  useEffect(() => {
    if (!multiViewConfig) return;

    if ((!selectedPlotUuid && multiViewPlotUuids.length) || !multiViewPlotUuids.includes(selectedPlotUuid)) {
      setSelectedPlotUuid(multiViewPlotUuids[0]);
    }
    if (localNRows !== multiViewConfig.nrows) {
      setLocalNRows(multiViewConfig.nrows);
    }

    if (localNCols !== multiViewConfig.ncols) {
      setLocalNCols(multiViewConfig.ncols);
    }
  }, [multiViewConfig]);

  useEffect(() => {
    if (!multiViewConfig || !localNRows || !localNCols) return;

    if (!_.isEqual((options.map((option) => option?.value)), multiViewConfig.plotUuids)) {
      setOptions(renderUuidOptions(multiViewConfig.plotUuids));
    }
  }, [multiViewConfig, localNRows, localNCols]);

  const addPlotToMultiView = () => {
    const plotUuidIndexes = multiViewPlotUuids.map((uuid) => parseInt(uuid.match(/[0-9]+/g), 10));
    const newIndexes = [...Array(30).keys()].filter((index) => !plotUuidIndexes.includes(index));

    const newPlotUuids = [...multiViewPlotUuids];

    const plotUuidToAdd = generateMultiViewGridPlotUuid(plotUuid, newIndexes[[0]]);
    newPlotUuids.push(plotUuidToAdd);

    // Taking the config the user currently sees (selectedConfig),
    const customConfig = {
      ...selectedConfig,
    };

    dispatch(loadConditionalComponentConfig(
      experimentId, plotUuidToAdd, plotType, true, customConfig,
    ));

    const multiViewUpdatedFields = { plotUuids: newPlotUuids };

    const gridSize = multiViewConfig.nrows * multiViewConfig.ncols;
    if (gridSize < newPlotUuids.length) {
      const newSize = Math.ceil(Math.sqrt(newPlotUuids.length));
      _.merge(multiViewUpdatedFields, { nrows: newSize, ncols: newSize });
    }

    updateMultiViewWithChanges(multiViewUpdatedFields);
  };

  if (!multiViewConfig) {
    return (
      <div data-testid='skeletonInput'>
        <Skeleton.Input style={{ width: 200 }} active />
      </div>
    );
  }

  const onPlotReorder = (index, newPosition) => {
    const newPlotUuids = arrayMoveImmutable(multiViewConfig.plotUuids, index, newPosition);

    updateMultiViewWithChanges({ plotUuids: newPlotUuids });
  };

  const onNodeDelete = (index) => {
    const newPlotUuids = [...multiViewConfig.plotUuids];
    _.pullAt(newPlotUuids, index);

    updateMultiViewWithChanges({ plotUuids: newPlotUuids });
  };

  const onRowsChange = (value) => {
    setLocalNRows(value);

    if (value) updateMultiViewWithChanges({ nrows: value });
  };

  const onColsChange = (value) => {
    setLocalNCols(value);

    if (value) updateMultiViewWithChanges({ ncols: value });
  };

  const hideDeleteButton = (multiViewPlotUuids.length === 1);

  const renderTitle = (index) => {
    const row = Math.floor(index / localNCols) + 1;
    const col = (index % localNCols) + 1;
    return (
      <Space>
        {`${row}.${col}`}
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

  console.log('multiViewPlotUuids!!!');
  console.log(multiViewPlotUuids);

  const treeData = multiViewPlotUuids.map((plotUuid, index) => (
    { key: index, title: renderTitle(index) }
  ));

  return (
    <Space direction='vertical'>
      <Form
        size='medium'
      // labelCol={{ span: 10, style: { textAlign: 'left' } }}
      // wrapperCol={{ span: 14 }}
      >
        <Form.Item>
          <Button
            type='primary'
            onClick={addPlotToMultiView}
            block
          >
            Add Plot
          </Button>
        </Form.Item>
        <p><strong>Controls Update:</strong></p>
        <Form.Item>
          <Radio.Group
            onChange={(e) => setUpdateAll(e.target.value)}
            value={updateAll}
          >
            <Radio value={false}>Selected Plot</Radio>
            <Radio
              // eslint-disable-next-line react/jsx-boolean-value
              value={true}
            >
              All Plots
            </Radio>
          </Radio.Group>
        </Form.Item>

        <p><strong>Selected Plot:</strong></p>
        <Form.Item>
          <Select
            aria-label='selectPlot'
            value={selectedPlotUuid}
            options={options}
            onChange={(value) => setSelectedPlotUuid(value)}
          />
        </Form.Item>
        <p><strong>Grid Dimensions:</strong></p>
        <Form.Item>
          <Row justify='left' align='left'>
            <Col span={3}>
              <InputNumber
                aria-label='setNRows'
                style={{ width: '100%' }}
                controls={false}
                min={1}
                max={30}
                value={localNRows}
                onChange={(value) => (value && onRowsChange(value))}
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
                onChange={(value) => (value && onColsChange(value))}
              />
            </Col>
          </Row>
        </Form.Item>
        <p><strong>Plot Order:</strong></p>
        <Form.Item>
          <HierarchicalTreeGenes
            treeData={treeData}
            onGeneReorder={onPlotReorder}
          />
        </Form.Item>

      </Form>
    </Space>
  );
};

MultiViewPlotEditor.propTypes = {
  shownGenes: PropTypes.array.isRequired,
  plotType: PropTypes.string.isRequired,
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  selectedPlotUuid: PropTypes.string.isRequired,
  setSelectedPlotUuid: PropTypes.func.isRequired,
  updateAll: PropTypes.bool.isRequired,
  setUpdateAll: PropTypes.func.isRequired,
};

export default MultiViewPlotEditor;
