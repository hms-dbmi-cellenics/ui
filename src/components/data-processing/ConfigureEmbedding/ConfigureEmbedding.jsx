import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Row, Col, Space, PageHeader, Collapse, Empty, Alert,
} from 'antd';

import { isUnisample } from 'utils/experimentPredicates';
import MiniPlot from 'components/plots/MiniPlot';

import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';

import PlotStyling from 'components/plots/styling/PlotStyling';
import loadCellMeta from 'redux/actions/cellMeta';
import generateDataProcessingPlotUuid from 'utils/generateDataProcessingPlotUuid';
import Loader from 'components/Loader';
import { getCellSets } from 'redux/selectors';
import CalculationConfig from 'components/data-processing/ConfigureEmbedding/CalculationConfig';

const { Panel } = Collapse;

const ConfigureEmbedding = (props) => {
  const { experimentId, onConfigChange } = props;
  const [plot, setPlot] = useState(null);
  const filterName = 'configureEmbedding';
  const cellSets = useSelector(getCellSets());
  const cellMeta = useSelector((state) => state.cellMeta);
  const [selectedPlot, setSelectedPlot] = useState('cellCluster');

  const dispatch = useDispatch();
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const continuousEmbeddingPlots = ['mitochondrialContent', 'doubletScores'];

  useEffect(() => {
    continuousEmbeddingPlots.forEach((dataName) => {
      if (cellMeta[dataName].loading && !cellMeta[dataName].error) {
        dispatch(loadCellMeta(experimentId, dataName));
      }
    });
  }, []);

  const plots = {
    cellCluster: {
      title: 'Colored by CellSets',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 0),
      plotType: 'embeddingPreviewByCellSets',
      plot: (config, actions) => (
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
          onUpdate={updatePlotWithChanges}
        />
      )
      ,
    },
    sample: {
      title: 'Colored by Samples',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 1),
      plotType: 'embeddingPreviewBySample',
      plot: (config, actions) => (
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
          actions={actions}
          onUpdate={updatePlotWithChanges}
        />
      ),
    },
    mitochondrialContent: {
      title: 'Mitochondrial fraction reads',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 2),
      plotType: 'embeddingPreviewMitochondrialContent',
      plot: (config, actions) => (
        <ContinuousEmbeddingPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
          plotUuid={generateDataProcessingPlotUuid(null, filterName, 2)}
          plotData={cellMeta.mitochondrialContent.data}
          loading={cellMeta.mitochondrialContent.loading}
          error={cellMeta.mitochondrialContent.error}
          reloadPlotData={() => dispatch(loadCellMeta(experimentId, 'mitochondrialContent'))}
          onUpdate={updatePlotWithChanges}
        />
      ),
    },
    doubletScores: {
      title: 'Cell doublet score',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 3),
      plotType: 'embeddingPreviewDoubletScore',
      plot: (config, actions) => (
        <ContinuousEmbeddingPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
          plotUuid={generateDataProcessingPlotUuid(null, filterName, 2)}
          plotData={cellMeta.doubletScores.data}
          loading={cellMeta.doubletScores.loading}
          error={cellMeta.doubletScores.error}
          reloadPlotData={() => dispatch(loadCellMeta(experimentId, 'doubletScores'))}
          onUpdate={updatePlotWithChanges}
        />
      ),
    },
  };

  const plotSpecificStylingControl = {
    sample: [
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
    cellCluster: [
      {
        panelTitle: 'Colours',
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
    mitochondrialContent: [
      {
        panelTitle: 'Colours',
        controls: ['colourScheme', 'colourInversion'],
      },
      {
        panelTitle: 'Markers',
        controls: ['markers'],
      },
      {
        panelTitle: 'Legend',
        controls: ['legend'],
      },
    ],
    doubletScores: [
      {
        panelTitle: 'Colours',
        controls: ['colourScheme', 'colourInversion'],
      },
      {
        panelTitle: 'Markers',
        controls: ['markers'],
      },
      {
        panelTitle: 'Legend',
        controls: ['legend'],
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
      controls: ['axes'],
    },
    ...plotSpecificStylingControl[selectedPlot],
  ];

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

  const selectedConfig = plotConfigs[plots[selectedPlot].plotUuid];

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
    if (!selectedConfig) {
      return;
    }

    const plotActions = {
      export: true,
    };
    if (cellSets.accessible && selectedConfig) {
      setPlot(plots[selectedPlot].plot(selectedConfig, plotActions));
    }
  }, [selectedConfig, cellSets]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const renderPlot = () => {
    // Spinner for main window
    if (!selectedConfig) {
      return (
        <center>
          <Loader />
        </center>
      );
    }

    if (selectedPlot === 'sample' && cellSets.accessible && isUnisample(cellSets.hierarchy)
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
          <CalculationConfig experimentId={experimentId} onConfigChange={onConfigChange} />
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

ConfigureEmbedding.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default ConfigureEmbedding;
