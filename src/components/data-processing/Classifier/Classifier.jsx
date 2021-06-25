import React, { useCallback, useEffect } from 'react';
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

import ClassifierEmptyDropsPlot from '../../plots/ClassifierEmptyDropsPlot';

import PlotStyling from '../../plots/styling/PlotStyling';
import CalculationConfigContainer from '../CalculationConfigContainer';
import CalculationConfig from './CalculationConfig';
import generateDataProcessingPlotUuid from '../../../utils/generateDataProcessingPlotUuid';

const { Panel } = Collapse;

const Classifier = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange, stepDisabled,
  } = props;

  const filterName = 'classifier';

  const plotUuid = generateDataProcessingPlotUuid(sampleId, filterName, 0);
  const plotType = 'classifierEmptyDropsPlot';
  const allowedPlotActions = {
    export: true,
    compiled: false,
    source: false,
    editor: false,
  };

  const dispatch = useDispatch();

  const debounceSave = useCallback(
    _.debounce((uuid) => dispatch(savePlotConfig(experimentId, uuid)), 2000), [],
  );

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
    debounceSave(plotUuid);
  };

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
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
          expConfig={expConfig}
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
                plotType='unused'
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

Classifier.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
};

Classifier.defaultProps = {
  stepDisabled: false,
};

export default Classifier;
