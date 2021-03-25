import React, {
  useState, useEffect, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Collapse, Skeleton, Alert,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import CalculationConfig from './CalculationConfig';
import MiniPlot from '../../plots/MiniPlot';

import { updateCellSetsClustering } from '../../../redux/actions/cellSets';

import PlotStyling from '../../plots/styling/PlotStyling';

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
  const { experimentId, onPipelineRun } = props;
  const [selectedPlot, setSelectedPlot] = useState('embedding');
  const [plot, setPlot] = useState(null);
  const cellSets = useSelector((state) => state.cellSets);

  const filterName = 'dataIntegration';

  const router = useRouter();
  const dispatch = useDispatch();
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const debouncedCellSetClustering = useCallback(
    _.debounce((resolution) => dispatch(updateCellSetsClustering(experimentId, resolution)), 2000),
    [],
  );

  const plots = {
    embedding: {
      title: 'Sample embedding',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 0),
      plotType: 'dataIntegrationEmbedding',
      plot: (config, plotData, actions) => (
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    frequency: {
      title: 'Frequency plot',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 1),
      plotType: 'dataIntegrationFrequency',
      plot: (config, plotData, actions) => (
        <FrequencyPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    elbow: {
      title: 'Elbow plot',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 2),
      plotType: 'dataIntegrationElbow',
      plot: (config, plotData, actions) => (
        <ElbowPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
  };

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

  const config = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );

  const plotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!config) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, [experimentId]);

  useEffect(() => {
    // if we change a plot and the config is not saved yet
    if (outstandingChanges) {
      dispatch(savePlotConfig(experimentId, plots[selectedPlot].plotUuid));
    }
  }, [selectedPlot]);

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!config || !plotData) {
      return;
    }

    if (!cellSets.loading
      && !cellSets.error
      && !cellSets.updateCellSetsClustering
      && config
      && plotData) {
      setPlot(plots[selectedPlot].plot(config, plotData, true));
      if (!config.selectedCellSet) { return; }

      const propertiesArray = Object.keys(cellSets.properties);
      const cellSetClusteringLength = propertiesArray.filter(
        (cellSet) => cellSet === config.selectedCellSet,
      ).length;

      if (!cellSetClusteringLength) {
        debouncedCellSetClustering(0.5);
      }
    }
  }, [config, cellSets, plotData]);

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
    // Spinner for main window
    if (!config) {
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
      <PageHeader
        title={plots[selectedPlot].title}
        style={{ width: '100%', paddingRight: '0px' }}
      />
      <Row>
        <Col span={15}>
          {renderPlot()}
        </Col>

        <Col span={3}>
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
        <Col span={5}>
          <CalculationConfig
            experimentId={experimentId}
            config={calculationConfig}
            onPipelineRun={onPipelineRun}
          />
          <Collapse>
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

DataIntegration.propTypes = {
  onPipelineRun: PropTypes.func.isRequired,
  experimentId: PropTypes.string.isRequired,
};

export default DataIntegration;
