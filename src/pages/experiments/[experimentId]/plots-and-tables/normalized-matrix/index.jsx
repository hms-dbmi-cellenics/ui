import React, { useEffect, useState } from 'react';
import {
  Skeleton,
  Empty,
  Space,
  Select,
} from 'antd';

import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { getCellSets } from 'redux/selectors';

import { loadCellSets } from 'redux/actions/cellSets';

import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import Loader from 'components/Loader';
import ExportAsCSV from 'components/plots/ExportAsCSV';

import { loadPlotConfig } from 'redux/actions/componentConfig';

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
    plotData,
    loading: plotDataLoading,
    error: plotDataError,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const cellSets = useSelector(getCellSets());

  const items = ['hola', 'chau', 'Qonda'];

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (cellSets.hierarchy.length === 0) dispatch(loadCellSets(experimentId));
  }, []);

  const renderControlPanel = () => (
    <>
      <Space direction='vertical' split={<></>} style={{ marginLeft: '10px', marginRight: '10px' }}>
        <Space>Select the parameters for subsetting the normalized expression matrix.</Space>
        <Space direction='vertical'>
          Select the samples to subset the data by:
          <MultiSelect items={items} />
        </Space>

        <ExportAsCSV data={[]} filename='' />
      </Space>
      {/* <div>Select the samples to subset the data:</div> */}
    </>
  );

  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
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

    if (plotDataError) {
      return (
        <center>
          <PlatformError />
        </center>
      );
    }

    if (!cellSets.accessible || plotDataLoading) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <Empty description={(
          <>
            <p>Click on "Download the normalized expression matrix" to obtain it as a .csv file</p>
          </>
        )}
        />
      </center>
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
        {renderPlot()}
      </PlotContainer>
    </>
  );
};

NormalizedMatrixPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default NormalizedMatrixPage;
