import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Col, Space, PageHeader, Collapse, Alert,
} from 'antd';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import CalculationConfig from './CalculationConfig';
import PlotStyling from '../../plots/styling/PlotStyling';

import MiniPlot from '../../plots/MiniPlot';
import EmptyPlot from '../../plots/helpers/EmptyPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import CategoricalEmbeddingPlot from '../../plots/CategoricalEmbeddingPlot';
import FrequencyPlot from '../../plots/FrequencyPlot';
import ElbowPlot from '../../plots/ElbowPlot';
import generateDataProcessingPlotUuid from '../../../utils/generateDataProcessingPlotUuid';

const { Panel } = Collapse;
const DataIntegration = (props) => {
  const {
    experimentId, onConfigChange, stepDisabled, disableDataIntegration,
  } = props;
  const [selectedPlot, setSelectedPlot] = useState('embedding');
  const [plot, setPlot] = useState(null);
  const cellSets = useSelector((state) => state.cellSets);

  const filterName = 'dataIntegration';
  const configureEmbeddingFilterName = 'configureEmbedding';

  const router = useRouter();
  const dispatch = useDispatch();
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const [plots] = useState({
    embedding: {
      title: 'Sample embedding',
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
          }}
          plotData={plotData}
          actions={actions}
        />
      ),
      blockedByConfigureEmbedding: true,
    },
    frequency: {
      title: 'Frequency plot',
      plotUuid: 'dataIntegrationFrequency',
      plotType: 'dataIntegrationFrequency',
      plot: (config, plotData, actions) => (
        <FrequencyPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
      blockedByConfigureEmbedding: true,
    },
    elbow: {
      title: 'Elbow plot',
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
          message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
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
          message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
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
        controls: ['colourScheme', 'colourInversion'],
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
      panelTitle: 'Axes and Margins',
      controls: ['axes'],
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
    (state) => state.experimentSettings.backendStatus.status.pipeline?.completedSteps,
  );

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
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!selectedConfig || !plotData) {
      return;
    }

    if (!cellSets.loading
      && !cellSets.error
      && !cellSets.updateCellSetsClustering
      && selectedConfig
      && plotData
    ) {
      setPlot(plots[selectedPlot].plot(selectedConfig, plotData, true));
    }
  }, [selectedConfig, cellSets, plotData, calculationConfig]);

  useEffect(() => {
    const showPopupWhenUnsaved = (url) => {
      // Only handle if we are navigating away.z
      const { plotUuid } = plots[selectedPlot];
      if (router.asPath === url || !outstandingChanges) {
        return;
      }
      // Show a confirmation dialog. Prevent moving away if the user decides not to.
      // eslint-disable-next-line no-alert
      if (
        // eslint-disable-next-line no-alert
        !window.confirm(
          'You have unsaved changes. Do you wish to save?',
        )
      ) {
        router.events.emit('routeChangeError');
        // Following is a hack-ish solution to abort a Next.js route change
        // as there's currently no official API to do so
        // See https://github.com/zeit/next.js/issues/2476#issuecomment-573460710
        // eslint-disable-next-line no-throw-literal
        throw `Route change to "${url}" was aborted (this error can be safely ignored). See https://github.com/zeit/next.js/issues/2476.`;
      } else {
        // if we click 'ok' the config is changed
        dispatch(savePlotConfig(experimentId, plotUuid));
      }
    };

    if (router.events) {
      router.events.on('routeChangeStart', showPopupWhenUnsaved);

      return () => {
        router.events.off('routeChangeStart', showPopupWhenUnsaved);
      };
    }
  }, [router.asPath, router.events]);

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

    if (plot) {
      return plot;
    }
  };

  return (
    <>
      <PageHeader
        title={plots[selectedPlot].title}
        style={{ width: '100%', paddingRight: '0px' }}
      />
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
                {plotObj.blockedByConfigureEmbedding && !configureEmbeddingFinished.current
                  ? (
                    <center>
                      <EmptyPlot mini />
                    </center>
                  )
                  : (
                    <MiniPlot
                      experimentId={experimentId}
                      plotUuid={plotObj.plotUuid}
                      plotFn={plotObj.plot}
                      actions={false}
                    />
                  )}
              </button>
            ))}
          </Space>
        </Col>

        <Col flex='1 0px'>
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
