import React, { useEffect, useState, useRef } from 'react';
import {
  Row, Col, Space, Collapse, Typography,
} from 'antd';

import Loader from 'components/Loader';
import PlatformError from 'components/PlatformError';

import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';

import PropTypes from 'prop-types';
import PlotHeader from 'components/plots/PlotHeader';

import { fetchPlotDataWork } from 'redux/actions/componentConfig';

import { plotNames } from 'utils/constants';

const { Panel } = Collapse;

const plotType = 'genericPlot';

const VolcanoPlotPage = (props) => {
  // eslint-disable-next-line react/prop-types
  const { experimentId, plotUuid = 'genericPlot1' } = props;

  const dispatch = useDispatch();

  const {
    // config,
    plotData: plotUrl,
    loading: plotDataLoading,
    error: plotDataError,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  // Cargar config
  useEffect(() => {
    dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType, false));
  }, []);

  useEffect(() => {
    // renderear le pleaut
  }, [plotUrl]);

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

  // const renderExtraPanels = () => (
  //   <>
  //     <Panel header='Differential Expression' key='1'>
  //       <DiffExprCompute
  //         experimentId={experimentId}
  //         onCompute={onComputeDiffExp}
  //       />
  //     </Panel>
  //   </>
  // );

  return (
    <>
      <PlotHeader
        title={plotNames.VOLCANO_PLOT}
        plotUuid={plotUuid}
        experimentId={experimentId}
      />
      <Space direction='vertical' style={{ width: '100%', padding: '0 10px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey='1'>
                <Panel header='Preview' key='1'>
                  <center>
                    <img src={plotUrl} alt='generic plot' style={{ width: '100%' }} />
                  </center>
                </Panel>
              </Collapse>
            </Space>
          </Col>
          <Col span={8}>
            {/* <PlotStyling
              // formConfig={plotStylingControlsConfig}
              config={config}
              // onUpdate={updatePlotWithChanges}
              // renderExtraPanels={renderExtraPanels}
              defaultActiveKey='1'
            /> */}
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
