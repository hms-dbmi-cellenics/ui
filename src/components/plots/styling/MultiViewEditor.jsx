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
import { arrayMoveImmutable } from 'utils/arrayUtils';
import HierarchicalTreeGenes from 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes';
import GeneSearchBar from 'components/plots/GeneSearchBar';
import { useDispatch, useSelector } from 'react-redux';
import { getPlotConfigs, getGeneList } from 'redux/selectors';
import {
  updatePlotConfig,
} from 'redux/actions/componentConfig/index';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';
import { plotUuids } from 'utils/constants';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';

const MultiViewEditor = (props) => {
  const {
    experimentId,
    plotType,
    plotUuid,
    shownGenes,
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

  const selectedConfig = plotConfigs[selectedPlotUuid];

  const geneList = useSelector(getGeneList());

  const geneNames = Object.keys(geneList.data);

  const renderUuidOptions = (uuids) => {
    if (!uuids) return [];

    return uuids.map((uuid, index) => {
      const row = Math.floor(index / localNCols) + 1;
      const col = (index % localNCols) + 1;
      return { label: `${row}.${col} ${shownGenes[index]}`, value: uuid };
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

    if (!_.isEqual((options.map((option) => option?.value)), multiViewConfig.plotUuids)
      || !options.every((option, i) => option?.label.includes(shownGenes[i]))) {
      setOptions(renderUuidOptions(multiViewConfig.plotUuids));
    }
  }, [multiViewConfig, shownGenes, localNRows, localNCols]);

  const addGeneToMultiView = (genes) => {
    const validGenes = genes.filter((gene) => geneNames.includes(gene));
    const genesToAdd = validGenes.slice(0, 30 - multiViewPlotUuids.length);

    if (genesToAdd.length === 0) return;

    const plotUuidIndexes = multiViewPlotUuids.map((uuid) => parseInt(uuid.match(/[0-9]+/g), 10));
    const newIndexes = [...Array(30).keys()].filter((index) => !plotUuidIndexes.includes(index));

    const newPlotUuids = [...multiViewPlotUuids];

    genesToAdd.forEach((gene, index) => {
      const plotUuidToAdd = generateMultiViewGridPlotUuid(plotUuid, newIndexes[index]);
      newPlotUuids.push(plotUuidToAdd);

      // Taking the config the user currently sees (selectedConfig),
      //  copy it and add the gene-specific settings
      const customConfig = {
        ...selectedConfig,
        shownGene: gene,
        title: { text: gene },
      };

      dispatch(loadConditionalComponentConfig(
        experimentId, plotUuidToAdd, plotType, true, customConfig,
      ));
    });

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

  const onGeneReorder = (index, newPosition) => {
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
      <HierarchicalTreeGenes
        treeData={treeData}
        onGeneReorder={onGeneReorder}
      />
    </Space>
  );
};

MultiViewEditor.propTypes = {
  shownGenes: PropTypes.array.isRequired,
  plotType: PropTypes.string.isRequired,
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  selectedPlotUuid: PropTypes.string.isRequired,
  setSelectedPlotUuid: PropTypes.func.isRequired,
  updateAll: PropTypes.bool.isRequired,
  setUpdateAll: PropTypes.func.isRequired,
};

export default MultiViewEditor;
