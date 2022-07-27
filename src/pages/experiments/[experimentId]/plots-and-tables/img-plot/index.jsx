import React, { useEffect, useState, useRef } from 'react';
import {
  Row, Col, Space, Collapse, Typography,
} from 'antd';

import Loader from 'components/Loader';
import PlatformError from 'components/PlatformError';

import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';

import PropTypes from 'prop-types';
import Header from 'components/Header';
// import PlotHeader from 'components/plots/PlotHeader';

import {
  fetchPlotDataWork, loadPlotConfig, updatePlotConfig,
} from 'redux/actions/componentConfig';

import { plotNames } from 'utils/constants';

import PlotStyling from 'components/plots/styling/PlotStyling';
import SingleGeneSelection from 'components/plots/styling/SingleGeneSelection';

import SelectPlotType from 'components/plots/styling/img-plot/SelectPlotType';

const { Panel } = Collapse;

const plotType = 'ImgPlot';

const VolcanoPlotPage = (props) => {
  // eslint-disable-next-line react/prop-types
  const { experimentId, plotUuid = 'ImgPlot' } = props;
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const [searchedGene, setSearchedGene] = useState(config?.shownGene);

  const {
    // config,
    plotData: plotUrl,
    loading: plotDataLoading,
    error: plotDataError,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  // Cargar config
  useEffect(() => {
    if (!plotUrl) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType, false));
  }, []);

  useEffect(() => {
    // renderear le pleaut
  }, [plotUrl]);

  useEffect(() => {
    if (config?.shownGene) {
      config.shownGene = searchedGene;
    }
    dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType, false));
  }, [searchedGene]);

  useEffect(() => {
    dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType, false));
  }, [config?.PlotSubType]);

  const updatePlotWithChanges = () => {
    dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType, false));
  };

  const updatePlotWithObject = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  if (plotDataLoading) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  if (plotDataError) {
    return (
      <center>
        <PlatformError
          description='Error loading plot data.'
          reason='Check the options that you have selected and try again.'
          onClick={() => dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType, false))}
        />
      </center>
    );
  }

  const renderExtraPanels = () => (
    <Collapse>
      <Panel header='Gene selection' key='1'>
        <SingleGeneSelection
          config={config}
          setSearchedGene={setSearchedGene}
        />
      </Panel>
      <Panel header='Type of plot' key='2'>
        <SelectPlotType
          config={config}
          onUpdate={updatePlotWithObject}
        />
      </Panel>
    </Collapse>
  );

  return (
    <>
      {/* <PlotHeader
        title='Ridge Plot'
        plotUuid={plotUuid}
        experimentId={experimentId}
      /> */}

      <Header title={plotNames.IMG_PLOT} />
      <Space direction='vertical' style={{ width: '100%', padding: '0 10px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey='1'>
                <Panel header='Preview' key='1'>
                  <center>
                    <img src={plotUrl} alt='generic plot' style={{ width: '100%', height: '100%' }} />
                  </center>
                </Panel>
              </Collapse>
            </Space>
          </Col>
          <Col span={8}>
            <PlotStyling
              // formConfig={plotStylingControlsConfig}
              onUpdate={updatePlotWithObject}
              renderExtraPanels={renderExtraPanels}
              defaultActiveKey='1'
            />
          </Col>
        </Row>
      </Space>
    </>
  );
};

VolcanoPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default VolcanoPlotPage;
