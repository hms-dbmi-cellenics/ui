import React, { useCallback, useEffect } from 'react';
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

import ClassifierEmptyDropsPlot from '../../plots/ClassifierEmptyDropsPlot';

import PlotStyling from '../../plots/styling/PlotStyling';
import CalculationConfig from './CalculationConfig';
import generatePlotUuid from '../../../utils/generatePlotUuid';

const { Panel } = Collapse;

const Classifier = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const filterName = 'classifier';

  const plotUuid = generatePlotUuid(sampleId, filterName, 0);
  const plotType = 'classifierEmptyDropsPlot';

  const allowedPlotActions = {
    export: true,
    compiled: false,
    source: false,
    editor: false,
  };

  const dispatch = useDispatch();

  const debounceSave = useCallback(_.debounce((uuid) => dispatch(savePlotConfig(experimentId, uuid)), 2000), []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
    debounceSave(plotUuid);
  };

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing.classifier[sampleId]?.filterSettings
      || state.experimentSettings.processing.classifier.filterSettings,
  );
  const plotData = useSelector((state) => state.componentConfig[plotUuid]?.plotData);

  useEffect(() => {
    if (!config) {
      const newConfig = _.clone(config);
      _.merge(newConfig, expConfig);
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [config]);

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

    if (config && plotData) {
      return (
        <ClassifierEmptyDropsPlot
          experimentId={experimentId}
          config={config}
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
          <Tooltip placement='bottom' title='The classifier combines several properties (mitochondrial content, entropy, etc.) into a single probability score and is used to refine the filtering of empty droplets. The cut-off is typically set around 0.6-0.9.'>
            <Button icon={<InfoCircleOutlined />} />
          </Tooltip>
        </Col>
        <Col span={6}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse defaultActiveKey={['settings']}>
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfig experimentId={experimentId} sampleId={sampleId} plotType='bin step' sampleIds={sampleIds} onConfigChange={onConfigChange} />
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

Classifier.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default Classifier;
