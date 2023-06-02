import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Row, Col, PageHeader, Radio, Collapse, Empty, Alert, Space,
} from 'antd';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';

import { isUnisample } from 'utils/experimentPredicates';

import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';
import ViolinFilterPlot from 'components/plots/ViolinFilterPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';

import PlotStyling from 'components/plots/styling/PlotStyling';
import loadCellMeta from 'redux/actions/cellMeta';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import Loader from 'components/Loader';
import { getCellSets } from 'redux/selectors';
import CalculationConfig from 'components/data-processing/ConfigureEmbedding/CalculationConfig';
import PlotLegendAlert, { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';
import EmptyPlot from 'components/plots/helpers/EmptyPlot';

const { Panel } = Collapse;

const ConfigureEmbedding = (props) => {
  const { experimentId, onConfigChange, stepHadErrors } = props;
  const [plot, setPlot] = useState(null);
  const filterName = 'configureEmbedding';
  const plotTypes = ['embedding', 'violin'];
  const [plotType, setPlotType] = useState('embedding');

  const cellSets = useSelector(getCellSets());
  const cellMeta = useSelector((state) => state.cellMeta);

  const initialPlotColouring = {
    embedding: 'cellCluster',
    violin: 'mitochondrialContent',
  };

  const [plotColouring, setPlotColouring] = useState(initialPlotColouring.embedding);

  const dispatch = useDispatch();
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );
  const cellMetaToLoad = ['mitochondrialContent', 'doubletScores', 'numOfGenes', 'numOfUmis'];
  const controlsDisabledForViolin = plotType === 'violin';
  const { hierarchy } = cellSets;

  useEffect(() => {
    cellMetaToLoad.forEach((dataName) => {
      if (cellMeta[dataName].loading && !cellMeta[dataName].error) {
        dispatch(loadCellMeta(experimentId, dataName));
      }
    });
  }, []);

  const categoricalEmbStylingControls = [
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
      controls: [{
        name: 'markers',
        props: { showShapeType: false },
      }],
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
  ];
  const continuousEmbStylingControls = [
    {
      panelTitle: 'Colours',
      controls: ['colourScheme', 'colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: [{
        name: 'markers',
        props: { showShapeType: false },
      }],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];
  const violinStylingControls = [
    {
      panelTitle: 'Markers',
      controls: ['violinMarkers'],
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

  ];

  const renderViolin = (colouring, config, actions) => {
    const { loading, data: plotData, error } = cellMeta[colouring];
    const modifiedConfig = {
      ...config,
      axes:{
        ...config.axes,
        yAxisText: config.axes.yAxisText || plotColouring,
      }
    }
    return (
      <ViolinFilterPlot
        experimentId={experimentId}
        plotData={plotData}
        config={modifiedConfig}
        loading={loading}
        error={error}
        actions={actions}
        reloadPlotData={() => dispatch(loadCellMeta(experimentId, colouring))}
        onUpdate={updatePlotWithChanges}
        cellSets={cellSets}
      />
    );
  };

  const renderContinuousEmbedding = (colouring, config, actions) => {
    const { loading, data: plotData, error } = cellMeta[colouring];
    return (
      <ContinuousEmbeddingPlot
        experimentId={experimentId}
        plotData={plotData}
        config={config}
        loading={loading}
        error={error}
        reloadPlotData={() => dispatch(loadCellMeta(experimentId, colouring))}
        onUpdate={updatePlotWithChanges}
        actions={actions}
      />
    );
  };

  const renderCategoricalEmbedding = (config, actions) => (
    <Space direction='vertical'>
      {config?.legend?.showAlert && <PlotLegendAlert stylingSectionName='Plot Options' />}
      <CategoricalEmbeddingPlot
        experimentId={experimentId}
        config={config}
        actions={actions}
        onUpdate={updatePlotWithChanges}
      />
    </Space>
  );

  const plots = {
    cellCluster: {
      title: 'Cell sets',
      subPlots: {
        embedding: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 0),
          plotType: 'embeddingPreviewByCellSets',
          plotStyling: categoricalEmbStylingControls,
          plot: (config, actions) => renderCategoricalEmbedding(config, actions),
        },
      },
    },
    sample: {
      title: 'Samples',
      subPlots: {
        embedding: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 1),
          plotType: 'embeddingPreviewBySample',
          plotStyling: categoricalEmbStylingControls,
          plot: (config, actions) => renderCategoricalEmbedding({
            ...config,
            legend: {
              ...config.legend,
              title: 'Sample Name',
            },
            selectedCellSet: 'sample',
          }, actions),
        },
      },
    },
    mitochondrialContent: {
      title: 'Mitochondrial fraction reads',
      subPlots: {
        embedding: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 2),
          plotType: 'embeddingPreviewMitochondrialContent',
          plotStyling: continuousEmbStylingControls,
          plot: (config, actions) => renderContinuousEmbedding('mitochondrialContent', config, actions),
        },
        violin: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 6),
          plotType: 'violin',
          plotStyling: violinStylingControls,
          plot: (config, actions) => renderViolin('mitochondrialContent', config, actions),
        },
      },
    },
    doubletScores: {
      title: 'Doublet score',
      subPlots: {
        embedding: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 3),
          plotType: 'embeddingPreviewDoubletScore',
          plotStyling: continuousEmbStylingControls,
          plot: (config, actions) => renderContinuousEmbedding('doubletScores', config, actions),
        },
        violin: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 7),
          plotType: 'violin',
          plotStyling: violinStylingControls,
          plot: (config, actions) => renderViolin('doubletScores', config, actions),
        },
      },
    },
    numOfGenes: {
      title: 'Number of genes',
      subPlots: {
        embedding: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 4),
          plotType: 'embeddingPreviewNumOfGenes',
          plotStyling: continuousEmbStylingControls,
          plot: (config, actions) => renderContinuousEmbedding('numOfGenes', config, actions),
        },
        violin: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 8),
          plotType: 'violin',
          plotStyling: violinStylingControls,
          plot: (config, actions) => renderViolin('numOfGenes', config, actions),
        },
      },
    },
    numOfUmis: {
      title: 'Number of UMIs',
      subPlots: {
        embedding: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 5),
          plotType: 'embeddingPreviewNumOfUmis',
          plotStyling: continuousEmbStylingControls,
          plot: (config, actions) => renderContinuousEmbedding('numOfUmis', config, actions),
        },
        violin: {
          plotUuid: generateDataProcessingPlotUuid(null, filterName, 9),
          plotType: 'violin',
          plotStyling: violinStylingControls,
          plot: (config, actions) => renderViolin('numOfUmis', config, actions),
        },
      },
    },
  };
  const currentPlot = plots[plotColouring].subPlots[plotType] || {};
  const { plotUuid: activePlotUuid, plotType: activePlotType } = currentPlot;

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
    ...currentPlot.plotStyling,
  ];

  const outstandingChanges = useSelector(
    (state) => state.componentConfig[currentPlot?.plotUuid]?.outstandingChanges,
  );

  const plotConfigs = useSelector((state) => {
    const plotConfigsToReturn = {};

    Object.values(plots).forEach(({ subPlots }) => {
      Object.values(subPlots).forEach(({ plotUuid }) => {
        plotConfigsToReturn[plotUuid] = state.componentConfig[plotUuid]?.config;
      });
    });
    return plotConfigsToReturn;
  });
  const selectedConfig = plotConfigs[activePlotUuid];

  useEffect(() => {
    Object.values(plots).forEach(({ subPlots }) => {
      Object.values(subPlots).forEach((subPlot) => {
        dispatch(loadPlotConfig(experimentId, subPlot.plotUuid, subPlot.plotType));
      });
    });
  }, []);

  useEffect(() => {
    if (!selectedConfig
      || !cellSets.accessible
      || !selectedConfig.legend.enabled) return;

    let legendItemKey = null;
    if (activePlotType === 'embeddingPreviewByCellSets') {
      legendItemKey = 'louvain';
    } else if (activePlotType === 'embeddingPreviewBySample') {
      legendItemKey = 'sample';
    } else {
      return;
    }

    const numLegendItems = hierarchy.find(({ key }) => key === legendItemKey)?.children.length;
    const showAlert = numLegendItems > MAX_LEGEND_ITEMS;

    if (showAlert) updatePlotWithChanges({ legend: { showAlert, enabled: !showAlert } });
  }, [!selectedConfig, activePlotType, cellSets.accessible]);

  useEffect(() => {
    // if we change a plot and the config is not saved yet
    if (outstandingChanges) {
      dispatch(savePlotConfig(experimentId, activePlotUuid));
    }
  }, [currentPlot]);

  useEffect(() => {
    if (!selectedConfig) {
      return;
    }

    const plotActions = {
      export: true,
    };
    if (cellSets.accessible && selectedConfig) {
      setPlot(currentPlot.plot(selectedConfig, plotActions));
    }
  }, [selectedConfig, cellSets, cellMeta]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(currentPlot.plotUuid, obj));
    debounceSave(currentPlot.plotUuid);
  };

  const renderExtraControlPanels = () => (
    <Panel header='Select data' key='select-data' collapsible={controlsDisabledForViolin && 'disabled'}>
      <SelectData
        config={selectedConfig}
        disabled={controlsDisabledForViolin}
        onUpdate={updatePlotWithChanges}
        cellSets={cellSets}
      />
    </Panel>
  );

  const renderPlot = () => {
    // Spinner for main window
    if (stepHadErrors) {
      return (
        <center>
          <EmptyPlot mini={false} style={{ width: 400, height: 400 }} />
        </center>
      );
    }

    // Spinner for main window
    if (!selectedConfig) {
      return (
        <center>
          <Loader />
        </center>
      );
    }

    if (plotColouring === 'sample' && cellSets.accessible && isUnisample(cellSets.hierarchy)
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
        title={plots[plotColouring].title}
        style={{ width: '100%', paddingRight: '0px' }}
      />
      <Row gutter={16}>
        <Col flex='auto'>
          <center>
            {renderPlot()}
          </center>
        </Col>

        <Col flex='1 0px' style={{ minWidth: '300px' }}>
          <Collapse defaultActiveKey={['plot-selector']}>
            <Panel header='Plot view' key='plot-selector'>
              <Space direction='vertical'>
                Plot type:
                <Radio.Group
                  onChange={(e) => {
                    // also reset the colouring to the initial for the plot type, because
                    // some plot types do not have every colouring option
                    setPlotType(e.target.value);
                    setPlotColouring(initialPlotColouring[e.target.value]);
                  }}
                  value={plotType}
                >
                  {plotTypes.map((type) => (
                    <Radio key={type} style={radioStyle} value={type}>
                      {type[0].toUpperCase() + type.slice(1)}
                    </Radio>
                  ))}
                </Radio.Group>
                Colour plot by:
                <Radio.Group onChange={(e) => setPlotColouring(e.target.value)} value={plotColouring}>
                  {Object.entries(plots).map(([key, plotObj]) => {
                    if (plots[key].subPlots[plotType]) {
                      return (
                        <Radio key={key} style={radioStyle} value={key}>
                          {plotObj.title}
                        </Radio>
                      );
                    }
                    return <></>;
                  })}
                </Radio.Group>
              </Space>
            </Panel>
          </Collapse>

          <CalculationConfig experimentId={experimentId} onConfigChange={onConfigChange} disabled={controlsDisabledForViolin} />
          <Collapse>
            <Panel header='Plot options' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={selectedConfig}
                onUpdate={updatePlotWithChanges}
                extraPanels={renderExtraControlPanels()}
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
  stepHadErrors: PropTypes.bool.isRequired,
};

export default ConfigureEmbedding;
