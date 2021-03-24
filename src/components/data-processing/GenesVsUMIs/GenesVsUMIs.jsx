import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Collapse, Row, Col, Space, Button, Tooltip, Skeleton,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import FeaturesVsUMIsScatterplot from '../../plots/FeaturesVsUMIsScatterplot';

import PlotStyling from '../../plots/styling/PlotStyling';
import CalculationConfig from './CalculationConfig';
import generateDataProcessingPlotUuid from '../../../utils/generateDataProcessingPlotUuid';

const { Panel } = Collapse;

const GenesVsUMIs = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const filterName = 'numGenesVsNumUmis';

  const plotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const plotType = 'featuresVsUMIsScatterplot';

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

  const config = useSelector(
    (state) => state.componentConfig[plotUuid]?.config,
  );
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing.numGenesVsNumUmis[sampleId]?.filterSettings
      || state.experimentSettings.processing.numGenesVsNumUmis.filterSettings,
  );
  const plotData = useSelector(
    (state) => state.componentConfig[plotUuid]?.plotData,
  );

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
        <FeaturesVsUMIsScatterplot
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
        <Col span={14}>
          {renderPlot()}
        </Col>

        <Col span={1}>
          <Tooltip placement='bottom' title='The number of genes vs number of UMIs plot is used to exclude cell fragments and outliers. The user can set the stringency (to define the confidence band), and the min/max cell size (note that min cell size will change across filters).'>
            <Button icon={<InfoCircleOutlined />} />
          </Tooltip>
        </Col>
        <Col span={6}>
          <Collapse defaultActiveKey={['settings']}>
            <Space direction='vertical' style={{ width: '100%' }} />
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfig
                experimentId={experimentId}
                sampleId={sampleId}
                sampleIds={sampleIds}
                onConfigChange={onConfigChange}
              />
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

GenesVsUMIs.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
};

GenesVsUMIs.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default GenesVsUMIs;
