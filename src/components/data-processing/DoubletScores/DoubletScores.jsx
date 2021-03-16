import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import {
  Collapse, Row, Col, Space, Button, Tooltip,
} from 'antd';
import PropTypes from 'prop-types';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import Loader from '../../Loader';
import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import DoubletScoreHistogram from '../../plots/DoubletScoreHistogram';

import PlotStyling from '../../plots/styling/PlotStyling';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;
const DoubletScores = (props) => {
  const {
    experimentId,
  } = props;

  const plotUuid = 'doubletScoreHistogram';
  const plotType = 'doubletScoreHistogram';

  const dispatch = useDispatch();

  const debounceSave = useCallback(_.debounce((uuid) => dispatch(savePlotConfig(experimentId, uuid)), 2000), []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
    debounceSave(plotUuid);
  };

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const plotData = useSelector((state) => state.componentConfig[plotUuid]?.plotData);

  useEffect(() => {
    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [config]);

  const plotStylingConfig = [
    {
      panelTitle: 'Plot Dimensions',
      controls: ['dimensions'],
    },
    {
      panelTitle: 'Axes',
      controls: ['axes'],
    },
    {
      panelTitle: 'Title',
      controls: ['title'],
    },
    {
      panelTitle: 'Font',
      controls: ['font'],
    },
  ];

  const renderPlot = () => {
    // Spinner for main window
    if (!config || !plotData) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    if (config && plotData) {
      return <DoubletScoreHistogram experimentId={experimentId} config={config} plotData={plotData} />;
    }
  };

  return (
    <>
      <Row>

        <Col span={17}>
          {renderPlot()}
        </Col>
        <Col span={1}>
          <Tooltip placement='bottom' title='Droplets may contain more than one cell. In such cases, it is not possible to distinguish which reads came from which cell. Such “cells” cause problems in the downstream analysis as they appear as an intermediate type. “Cells” with a high probability of being a doublet should be excluded. The cut-off is typically set around 0.25.'>
            <Button icon={<InfoCircleOutlined />} />
          </Tooltip>
        </Col>
        <Col span={6}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse defaultActiveKey={['settings']}>
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfig experimentId={experimentId} />
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

DoubletScores.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default DoubletScores;
