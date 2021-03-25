import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import {
  Collapse, Row, Col, Space, Button, Tooltip, Skeleton,
} from 'antd';
import PropTypes from 'prop-types';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import DoubletScoreHistogram from '../../plots/DoubletScoreHistogram';

import PlotStyling from '../../plots/styling/PlotStyling';
import CalculationConfigContainer from '../CalculationConfigContainer';
import CalculationConfig from './CalculationConfig';
import generateDataProcessingPlotUuid from '../../../utils/generateDataProcessingPlotUuid';

const { Panel } = Collapse;
const DoubletScores = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const filterName = 'doubletScores';

  const plotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const plotType = 'doubletScoreHistogram';

  const dispatch = useDispatch();

  const allowedPlotActions = {
    export: true,
    compiled: false,
    source: false,
    editor: false,
  };

  const debounceSave = useCallback(
    _.debounce((uuid) => dispatch(savePlotConfig(experimentId, uuid)), 2000), [],
  );

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
    debounceSave(plotUuid);
  };

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing.doubletScores[sampleId]?.filterSettings
      || state.experimentSettings.processing.doubletScores.filterSettings,
  );
  const plotData = useSelector((state) => state.componentConfig[plotUuid]?.plotData);

  const [renderConfig, setRenderConfig] = useState(null);

  useEffect(() => {
    const newConfig = _.clone(config);
    _.merge(newConfig, expConfig);

    setRenderConfig(newConfig);
  }, [config, expConfig]);

  useEffect(() => {
    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [experimentId]);

  const plotStylingControlsConfig = [
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
          <Skeleton.Image style={{ width: 400, height: 400 }} />
        </center>
      );
    }

    if (renderConfig && plotData) {
      return (
        <DoubletScoreHistogram
          experimentId={experimentId}
          config={renderConfig}
          plotData={plotData}
          actions={allowedPlotActions}
        />
      );
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
              <CalculationConfigContainer
                filterUuid='doubletScores'
                experimentId={experimentId}
                sampleId={sampleId}
                sampleIds={sampleIds}
                onConfigChange={onConfigChange}
                plotType='bin step'
              >
                <CalculationConfig />
              </CalculationConfigContainer>
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={config}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

DoubletScores.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

DoubletScores.defaultProps = {
};

export default DoubletScores;
