import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Col, Radio, PageHeader, Collapse, Alert, Empty,
} from 'antd';
import _ from 'lodash';
import PropTypes from 'prop-types';

import { getBackendStatus, getCellSets } from 'redux/selectors';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';

import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import FrequencyPlot from 'components/plots/FrequencyPlot';
import ElbowPlot from 'components/plots/ElbowPlot';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import EmptyPlot from 'components/plots/helpers/EmptyPlot';
import PlotStyling from 'components/plots/styling/PlotStyling';
import { isUnisample } from 'utils/experimentPredicates';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;
const DataIntegration = (props) => {
  const {
    experimentId, onConfigChange, stepDisabled, disableDataIntegration,
  } = props;
  const [selectedPlot, setSelectedPlot] = useState('embedding');
  const [plot, setPlot] = useState(null);
  const cellSets = useSelector(getCellSets());
  const filterName = 'dataIntegration';
  const configureEmbeddingFilterName = 'configureEmbedding';

  const dispatch = useDispatch();
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const [plots] = useState({
    embedding: {
      title: 'Embedding coloured by sample',
      plotUuid: generateDataProcessingPlotUuid(null, configureEmbeddingFilterName, 1),
      plotType: 'dataIntegrationEmbedding',
      plot: (config, plotData, actions) => (
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={{
            ...config,
            legend: {
              ...config.legend,
              title: 'Sample Name',
            },
            selectedCellSet: 'sample',
            axes: {
              defaultValues: [],
            },
          }}
          actions={actions}
          onUpdate={updatePlotWithChanges}
        />
      ),
      blockedByConfigureEmbedding: true,
    },
    frequency: {
      title: 'Frequency plot coloured by sample',
      plotUuid: 'dataIntegrationFrequency',
      plotType: 'dataIntegrationFrequency',
      plot: (config, plotData, actions) => (
        <FrequencyPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
        />
      ),
      blockedByConfigureEmbedding: true,
    },
    elbow: {
      title: 'Elbow plot showing principal components',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 1),
      plotType: 'dataIntegrationElbow',
      plot: (config, plotData, actions) => (
        <ElbowPlot
          config={config}
          plotData={plotData}
          actions={actions}
          numPCs={calculationConfig?.dimensionalityReduction.numPCs}
        />
      ),
      blockedByConfigureEmbedding: false,
    },
  });

  const plotSpecificStylingControl = {
    embedding: [
      {
        panelTitle: 'Colour Inversion',
        controls: ['colourInversion'],
        footer: <Alert
          message='Changing plot colours is not available here. Use the Cell sets and Metadata tool in Data Exploration to customise cell set and metadata colours'
          type='info'
        />,
      },
      {
        panelTitle: 'Markers',
        controls: ['markers'],
      },
      {
        panelTitle: 'Legend',
        controls: [{
          name: 'legend',
          props: {
            option: {
              positions: 'top-bottom',
            },
          },
        }],
      },
      {
        panelTitle: 'Labels',
        controls: ['labels'],
      },
    ],
    frequency: [
      {
        panelTitle: 'Colours',
        controls: ['colourInversion'],
        footer: <Alert
          message='Changing plot colours is not available here. Use the Cell sets and Metadata tool in Data Exploration to customise cell set and metadata colours'
          type='info'
        />,
      },
      {
        panelTitle: 'Legend',
        controls: [{
          name: 'legend',
          props: {
            option: {
              positions: 'top-bottom',
            },
          },
        }],
      },
    ],
    elbow: [
      {
        panelTitle: 'Colours',
        controls: ['colourInversion'],
      },
    ],
  };

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Axes and margins',
      controls: ['axesWithRanges'],
    },
    ...plotSpecificStylingControl[selectedPlot],
  ];

  const calculationConfig = useSelector(
    (state) => state.experimentSettings.processing.dataIntegration,
  );

  const outstandingChanges = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.outstandingChanges,
  );

  const plotConfigs = useSelector((state) => {
    const plotUuids = Object.values(plots).map((plotIt) => plotIt.plotUuid);

    const plotConfigsToReturn = plotUuids.reduce((acum, plotUuidIt) => {
      // eslint-disable-next-line no-param-reassign
      acum[plotUuidIt] = state.componentConfig[plotUuidIt]?.config;
      return acum;
    }, {});

    return plotConfigsToReturn;
  });

  const plotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  const selectedConfig = plotConfigs[plots[selectedPlot].plotUuid];

  const completedSteps = useSelector(
    getBackendStatus(experimentId),
  ).status?.pipeline?.completedSteps;

  const configureEmbeddingFinished = useRef(null);
  useEffect(() => {
    configureEmbeddingFinished.current = completedSteps?.includes('ConfigureEmbedding');
  }, [completedSteps]);

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!plotConfigs[obj.plotUuid]) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, []);

  useEffect(() => {
    // if we change a plot and the config is not saved yet
    if (outstandingChanges) {
      dispatch(savePlotConfig(experimentId, plots[selectedPlot].plotUuid));
    }
  }, [selectedPlot]);

  useEffect(() => {
    if (!selectedConfig) {
      return;
    }

    if (cellSets.accessible && selectedConfig) {
      setPlot(plots[selectedPlot].plot(selectedConfig, plotData, true));
    }
  }, [selectedConfig, cellSets, plotData, calculationConfig]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const renderPlot = () => {
    const disabledByConfigEmbedding = plots[selectedPlot].blockedByConfigureEmbedding
      && !configureEmbeddingFinished.current;

    // Spinner for main window
    if (!selectedConfig || disabledByConfigEmbedding) {
      return (
        <center>
          <EmptyPlot mini={false} style={{ width: 400, height: 400 }} />
        </center>
      );
    }

    if ((selectedPlot === 'embedding' || selectedPlot === 'frequency') && cellSets.accessible && isUnisample(cellSets.hierarchy)
    ) {
      return (
        <center>
          <Empty
            style={{ width: selectedConfig.dimensions.width }}
            description='Your project has only one sample.'
          />
        </center>

      );
    }

    if (plot) {
      return plot;
    }
  };
  const radioStyle = {
    display: 'block',
    minHeight: '30px',
  };

  return (
    <>
      <PageHeader
        title={plots[selectedPlot].title}
        style={{ width: '100%', paddingRight: '0px' }}
      />
      <Row gutter={16}>
        <Col flex='auto'>
          <center>
            {renderPlot()}
          </center>
        </Col>

        <Col flex='1 0px'>
          <Collapse defaultActiveKey={['plot-selector']}>
            <Panel header='Plot view' key='plot-selector'>
              <Radio.Group onChange={(e) => setSelectedPlot(e.target.value)} value={selectedPlot}>
                {Object.entries(plots).map(([key, plotObj]) => (
                  <Radio key={key} style={radioStyle} value={key}>
                    {plotObj.title}
                  </Radio>
                ))}
              </Radio.Group>
            </Panel>
          </Collapse>
          <CalculationConfig
            experimentId={experimentId}
            onConfigChange={onConfigChange}
            config={calculationConfig}
            disabled={stepDisabled}
            disableDataIntegration={disableDataIntegration}
          />
          <Collapse>
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

DataIntegration.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  disableDataIntegration: PropTypes.bool,
};

DataIntegration.defaultProps = {
  stepDisabled: false,
  disableDataIntegration: false,
};

export default DataIntegration;
