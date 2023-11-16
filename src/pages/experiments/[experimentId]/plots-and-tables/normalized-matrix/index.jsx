import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  Skeleton,
  Button,
  Space,
  Alert,
} from 'antd';

import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import {
  getCellSets, getCellSetsHierarchyByKeys, getCellSetsHierarchyByType,
} from 'redux/selectors';

import { loadCellSets } from 'redux/actions/cellSets';

import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import Loader from 'components/Loader';

import {
  downloadNormalizedMatrix, loadPlotConfig, updatePlotConfig,
} from 'redux/actions/componentConfig';

import { plotNames, plotTypes } from 'utils/constants';
import PlatformError from 'components/PlatformError';
import MultiSelect from 'components/MultiSelect';
import endUserMessages from 'utils/endUserMessages';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';

const plotUuid = 'normalized-matrix';
const plotType = plotTypes.NORMALIZED_EXPRESSION_MATRIX;

const plotStylingConfig = [];

const renderDownloadNormalizedError = (configError) => {
  let alertType;
  let description;

  if (configError.includes('R_WORKER_EMPTY_CELL_SET')) {
    alertType = 'warning';
    description = endUserMessages.ERROR_NO_MATCHING_CELLS_NORMALIZED_EXPRESSION_MATRIX;
  } else if (configError.includes('Your request took past the timeout')) {
    alertType = 'error';
    description = endUserMessages.WORK_REQUEST_TIMED_OUT_RETRY;
  } else {
    alertType = 'error';
    description = endUserMessages.ERROR_FETCHING_NORMALIZED_EXPRESSION_MATRIX;
  }

  return (
    <Alert
      description={description}
      type={alertType}
      showIcon
    />
  );
};

const NormalizedMatrixPage = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();

  const {
    config,
    loading: configLoading,
    error: configError,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const cellSets = useSelector(getCellSets());
  const [sample, louvain, scratchpad] = useSelector(getCellSetsHierarchyByKeys(['sample', 'louvain', 'scratchpad']));
  const metadataTracks = useSelector(getCellSetsHierarchyByType('metadataCategorical', ['sample']));
  const CLMTracks = useSelector(getCellSetsHierarchyByType('CLM'));
  const CLMPerSampleTracks = useSelector(getCellSetsHierarchyByType('CLMPerSample'));

  const [metadataCellSets, setMetadataCellSets] = useState(null);
  const [cellLevelMetadataCellSets, setCellLevelMetadataCellSets] = useState(null);

  const onSelectedItemsChanged = (type) => (newItems) => {
    const newConfig = {
      ...config,
      [type]: newItems,
    };

    dispatch(updatePlotConfig(plotUuid, newConfig));
  };

  useConditionalEffect(() => {
    if (!cellSets.accessible) return;

    setMetadataCellSets(metadataTracks.map((track) => track.children).flat());
  }, [metadataTracks, cellSets.accessible]);

  // TODO, is this needed?
  useConditionalEffect(() => {
    if (!cellSets.accessible) return;
    const cellLevelMetadataTracks = CLMTracks.concat(CLMPerSampleTracks);

    setCellLevelMetadataCellSets(cellLevelMetadataTracks.map((track) => track.children).flat());
  }, [CLMTracks, CLMPerSampleTracks, cellSets.accessible]);

  useEffect(() => {
    if (!config) { dispatch(loadPlotConfig(experimentId, plotUuid, plotType)); }
    dispatch(loadCellSets(experimentId));
  }, []);

  const renderControlPanel = () => {
    if (!config) {
      return <Skeleton />;
    }

    if (cellSets.error) {
      return (
        <center>
          <PlatformError
            description='Error loading cell sets'
            onClick={() => dispatch(loadCellSets(experimentId))}
          />
        </center>
      );
    }

    if (!cellSets.accessible || configLoading || _.isNil(metadataCellSets)) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <>
        <Space
          direction='vertical'
          split={<></>}
          style={{
            overflow: 'scroll', marginLeft: '10px', marginRight: '10px', paddingTop: '10px',
          }}
        >
          <Space>Select the parameters for subsetting the normalized expression matrix.</Space>
          <Space direction='vertical'>
            Subset by samples:
            <MultiSelect
              options={sample.children.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('sample')}
              selectedKeys={config.sample}
              placeholder='All'
              style={{ width: '200px' }}
            />
          </Space>
          <Space direction='vertical'>
            Subset by metadata group:
            <MultiSelect
              options={metadataCellSets.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('metadata')}
              selectedKeys={config.metadata}
              placeholder='All'
              style={{ width: '200px' }}
            />
          </Space>
          <Space direction='vertical'>
            Subset by clusters:
            <MultiSelect
              options={louvain.children.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('louvain')}
              selectedKeys={config.louvain}
              placeholder='All'
              style={{ width: '200px' }}
            />
          </Space>
          <Space direction='vertical'>
            Subset by custom cell sets:
            <MultiSelect
              options={scratchpad.children.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('scratchpad')}
              selectedKeys={config.scratchpad}
              placeholder='All'
              style={{ width: '200px' }}
            />
          </Space>
          <Space direction='vertical'>
            Subset by cell-level metadata:
            <MultiSelect
              options={cellLevelMetadataCellSets.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('clm')}
              selectedKeys={config.clm}
              placeholder='All'
              style={{ width: '200px' }}
            />
          </Space>

          <Button
            size='small'
            onClick={
              () => dispatch(downloadNormalizedMatrix(plotUuid, experimentId, config))
            }
          >
            Download
          </Button>
          {configError && renderDownloadNormalizedError(configError)}
        </Space>
      </>
    );
  };

  return (
    <>
      <Header title={plotNames.NORMALIZED_EXPRESSION_MATRIX} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        customControlPanel={renderControlPanel()}
        controlsOnly
      />
    </>
  );
};

NormalizedMatrixPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default NormalizedMatrixPage;

export { plotUuid };
