import React, { useState, useCallback, useEffect } from 'react';
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
import ClassifierKneePlot from '../../plots/ClassifierKneePlot';
import generateDataProcessingPlotUuid from '../../../utils/generateDataProcessingPlotUuid';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfigContainer from '../CalculationConfigContainer';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;

const filterName = 'classifier';

const allowedPlotActions = {
  export: true,
  compiled: false,
  source: false,
  editor: false,
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

const Classifier = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange, stepDisabled,
  } = props;

  const dispatch = useDispatch();

  const [selectedPlot, setSelectedPlot] = useState('kneePlot');
  const [plot, setPlot] = useState(null);

  const debounceSave = useCallback(
    _.debounce((uuid) => dispatch(savePlotConfig(experimentId, uuid)), 2000), [],
  );

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const plots = {
    kneePlot: {
      title: 'Knee Plot',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: 'classifierKneePlot',
      plot: (config, plotData, actions) => (
        <ClassifierKneePlot
          config={config}
          expConfig={expConfig}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    histogram: {
      title: 'Histogram',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 0),
      plotType: 'cellSizeDistributionHistogram',
      plot: (config, plotData, actions) => (
        <ClassifierEmptyDropsPlot
          config={config}
          expConfig={expConfig}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
  };

  const selectedPlotConfig = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );

  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );

  const selectedPlotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!selectedPlotConfig) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, []);

  useEffect(() => {
    if (selectedPlotConfig && selectedPlotData && expConfig) {
      const newConfig = _.clone(selectedPlotConfig);
      _.merge(newConfig, expConfig);
      setPlot(plots[selectedPlot].plot(newConfig, selectedPlotData, allowedPlotActions));
    }
  }, [expConfig, selectedPlotConfig, selectedPlotData]);

  const renderPlot = () => {
    // Spinner for main window
    if (!selectedPlotConfig || !selectedPlotData) {
      return (
        <center>
          <Skeleton.Image style={{ width: 400, height: 400 }} />
        </center>
      );
    }

    if (plot) {
      return plot;
    }
  };

  return (
    <>
      <Row gutter={16}>
        <Col flex='auto'>
          {renderPlot()}
        </Col>

        <Col flex='1 0px'>
          <Space direction='vertical'>
            {Object.entries(plots).map(([key, plotObj]) => (
              <button
                type='button'
                key={key}
                onClick={() => setSelectedPlot(key)}
                style={{
                  margin: 0,
                  backgroundColor: 'transparent',
                  align: 'center',
                  padding: '8px',
                  border: '1px solid #000',
                  cursor: 'pointer',
                }}
              >
                <MiniPlot
                  experimentId={experimentId}
                  plotUuid={plotObj.plotUuid}
                  plotFn={plotObj.plot}
                  actions={false}
                />

              </button>

            ))}
          </Space>
        </Col>

        <Col flex='1 0px'>
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
                config={selectedPlotConfig}
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
