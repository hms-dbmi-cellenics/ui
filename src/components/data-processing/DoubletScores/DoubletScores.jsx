import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Collapse, Row, Col, Space, Skeleton,
} from 'antd';
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

const allowedPlotActions = {
  export: true,
  compiled: false,
  source: false,
  editor: false,
};

const filterName = 'doubletScores';
const plotType = 'doubletScoreHistogram';

const DoubletScores = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange, stepDisabled,
  } = props;

  const plotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);

  const dispatch = useDispatch();

  const [renderConfig, setRenderConfig] = useState(null);

  const debounceSave = useCallback(
    _.debounce((uuid) => dispatch(savePlotConfig(experimentId, uuid)), 2000), [],
  );

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );
  const plotData = useSelector((state) => state.componentConfig[plotUuid]?.plotData);

  useEffect(() => {
    const newConfig = _.clone(config);
    _.merge(newConfig, expConfig);

    setRenderConfig(newConfig);
  }, [config, expConfig]);

  useEffect(() => {
    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
    debounceSave(plotUuid);
  };

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
      <Row gutter={16}>
        <Col flex='auto'>
          {renderPlot()}
        </Col>

        <Col flex='1 0px'>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse defaultActiveKey={['settings']}>
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfigContainer
                filterUuid={filterName}
                sampleId={sampleId}
                sampleIds={sampleIds}
                onConfigChange={onConfigChange}
                plotType='bin step'
                stepDisabled={stepDisabled}
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
  stepDisabled: PropTypes.bool,
};

DoubletScores.defaultProps = {
  stepDisabled: false,
};

export default DoubletScores;
