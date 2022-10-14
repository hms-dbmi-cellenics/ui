import React, { useEffect, useState } from 'react';
import {
  Skeleton,
  Empty,
  Space,
  Button,
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

const plotUuid = 'normalized-matrix';
const plotType = plotTypes.NORMALIZED_EXPRESSION_MATRIX;

const plotStylingConfig = [];

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

  const [metadataCellSets, setMetadataCellSets] = useState([]);

  const onSelectedItemsChanged = (type) => (newItems) => {
    const newConfig = {
      ...config,
      [type]: newItems.map(({ key }) => key),
    };

    dispatch(updatePlotConfig(plotUuid, newConfig));
  };

  useEffect(() => {
    setMetadataCellSets(metadataTracks.map((track) => track.children).flat());
  }, [metadataTracks]);

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

    if (configError) {
      return (
        <center>
          <PlatformError />
        </center>
      );
    }

    if (!cellSets.accessible || configLoading) {
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
              items={sample.children.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('sample')}
              initialSelectedKeys={config.sample}
              placeholder='All'
            />
          </Space>
          <Space direction='vertical'>
            Subset by metadata group:
            <MultiSelect
              items={metadataCellSets.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('metadata')}
              initialSelectedKeys={config.metadata}
              placeholder='All'
            />
          </Space>
          <Space direction='vertical'>
            Subset by clusters:
            <MultiSelect
              items={louvain.children.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('louvain')}
              initialSelectedKeys={config.louvain}
              placeholder='All'
            />
          </Space>
          <Space direction='vertical'>
            Subset by custom cell sets:
            <MultiSelect
              items={scratchpad.children.map(({ key, name }) => ({ key, name }))}
              onChange={onSelectedItemsChanged('scratchpad')}
              initialSelectedKeys={config.scratchpad}
              placeholder='All'
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
        defaultActiveKey='gene-selection'
      >
        <center>
          <Empty description={(
            <>
              <p>
                Click on &quot;Download the normalized expression matrix&quot;
                to obtain it as a .csv file
              </p>
            </>
          )}
          />
        </center>
      </PlotContainer>
    </>
  );
};

NormalizedMatrixPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default NormalizedMatrixPage;

export { plotUuid };
