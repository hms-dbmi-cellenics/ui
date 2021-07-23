import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Collapse,
  Row,
  Col,
  Space,
  Skeleton,
} from 'antd';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import CellSizeDistributionHistogram from '../../plots/CellSizeDistributionHistogram';
import CellSizeDistributionKneePlot from '../../plots/CellSizeDistributionKneePlot';
import generateDataProcessingPlotUuid from '../../../utils/generateDataProcessingPlotUuid';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfigContainer from '../CalculationConfigContainer';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;

const HIGHEST_UMI_DEFAULT = 17000;

const filterName = 'cellSizeDistribution';

const allowedPlotActions = {
  export: true,
  compiled: false,
  source: false,
  editor: false,
};

const CellSizeDistribution = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange, stepDisabled,
  } = props;

  const dispatch = useDispatch();

  const [selectedPlot, setSelectedPlot] = useState('kneePlot');
  const [plot, setPlot] = useState(null);
  const highestUmiRef = useRef(null);

  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const plots = {
    kneePlot: {
      title: 'Knee Plot',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 0),
      plotType: 'cellSizeDistributionKneePlot',
      plot: (config, plotData, actions) => (
        <CellSizeDistributionKneePlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    histogram: {
      title: 'Histogram',
      plotUuid: generateDataProcessingPlotUuid(sampleId, filterName, 1),
      plotType: 'cellSizeDistributionHistogram',
      plot: (config, plotData, actions) => (
        <CellSizeDistributionHistogram
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
          highestUmi={highestUmiRef.current}
        />
      ),
    },
  };

  const selectedConfig = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing[filterName][sampleId].filterSettings,
  );
  const selectedPlotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  const histogramPlotData = useSelector(
    (state) => state.componentConfig[plots.histogram.plotUuid]?.plotData,
  );

  useEffect(() => {
    highestUmiRef.current = _.maxBy(
      histogramPlotData,
      (datum) => datum.u,
    )?.u ?? HIGHEST_UMI_DEFAULT;
  }, [histogramPlotData]);

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!selectedConfig) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, []);

  useEffect(() => {
    if (selectedConfig && selectedPlotData && expConfig) {
      const newConfig = _.clone(selectedConfig);
      _.merge(newConfig, expConfig);
      setPlot(plots[selectedPlot].plot(newConfig, selectedPlotData, allowedPlotActions));
    }
  }, [expConfig, selectedConfig, selectedPlotData]);

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
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
    if (!selectedConfig || !selectedPlotData) {
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
                plotType='bin step'
                stepDisabled={stepDisabled}
              >
                <CalculationConfig highestUmi={highestUmiRef.current} />
              </CalculationConfigContainer>
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={selectedConfig}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

CellSizeDistribution.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
};

CellSizeDistribution.defaultProps = {
  stepDisabled: false,
};

export default CellSizeDistribution;
