import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Row, Col, PageHeader, Radio, Collapse, Empty, Alert, Space, Button, Divider,
} from 'antd';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';

import { getIsUnisample } from 'utils/experimentPredicates';

import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';
import ViolinFilterPlot from 'components/plots/ViolinFilterPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import PlotStyling from 'components/plots/styling/PlotStyling';
import loadCellMeta from 'redux/actions/cellMeta';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import Loader from 'components/Loader';
import { getCellSets } from 'redux/selectors';
import { getEmbeddingInitialConfig } from 'utils/plotConfig/getEmbeddingInitialConfig';
import CalculationConfig from 'components/data-processing/ConfigureEmbedding/CalculationConfig';
import PlotLegendAlert, { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';
import EmptyPlot from 'components/plots/helpers/EmptyPlot';

const { Panel } = Collapse;

const ConfigureEmbedding = (props) => {
  const {
    experimentId, onConfigChange, stepHadErrors, isSpatial,
  } = props;
  const [plot, setPlot] = useState(null);
  // which plotUuid the current `plot` element was built for, so we don't briefly
  // show the previous colouring's plot while switching (the build effect lags a render)
  const [renderedPlotUuid, setRenderedPlotUuid] = useState(null);
  // per-plotUuid flag: the large-dataset marker default has been resolved (applied,
  // or determined unnecessary). Gates rendering so the embedding never first paints
  // with the standard point size/outline and then visibly re-adjusts.
  const [markerSettled, setMarkerSettled] = useState({});
  const filterName = 'configureEmbedding';
  const plotTypes = ['embedding', 'violin'];
  const [plotType, setPlotType] = useState('embedding');

  const cellSets = useSelector(getCellSets());
  const cellMeta = useSelector((state) => state.cellMeta);
  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );
  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const initialPlotColouring = {
    embedding: 'cellCluster',
    violin: 'mitochondrialContent',
  };

  const [plotColouring, setPlotColouring] = useState(initialPlotColouring.embedding);
  const [isResetDisabled, setIsResetDisabled] = useState(true);

  const dispatch = useDispatch();
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );
  // Spatial (visium_hd) datasets don't compute doublet scores, so don't load that
  // cell metadata or offer it as a "colour plot by" option.
  const cellMetaToLoad = isSpatial
    ? ['mitochondrialContent', 'numOfGenes', 'numOfUmis']
    : ['mitochondrialContent', 'doubletScores', 'numOfGenes', 'numOfUmis'];
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
      panelTitle: 'Colour inversion',
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
          defaultTitle: 'Cluster Name',
        },
      }],
    },
    {
      panelTitle: 'Labels',
      controls: ['labels'],
    },
  ];
  const sampleEmbStylingControls = [
    {
      panelTitle: 'Colour inversion',
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
          defaultTitle: 'Sample Name',
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
      axes: {
        ...config.axes,
        yAxisText: config.axes.yAxisText || plotColouring,
      },
    };
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
    const modifiedConfig = {
      ...config,
      legend: {
        ...config.legend,
        defaultValues: config.legend.defaultValues || ['title'],
      },
    };
    return (
      <ContinuousEmbeddingPlot
        experimentId={experimentId}
        plotData={plotData}
        config={modifiedConfig}
        loading={loading}
        error={error}
        reloadPlotData={() => dispatch(loadCellMeta(experimentId, colouring))}
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
          plotStyling: sampleEmbStylingControls,
          plot: (config, actions) => renderCategoricalEmbedding({
            ...config,
            legend: {
              ...config.legend,
              defaultLegendTitle: 'Sample Name',
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

  // doublet scores aren't computed for spatial (visium_hd) datasets
  if (isSpatial) delete plots.doubletScores;

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
      controls: [{
        name: 'axesWithRanges',
        props: {
          embeddingMethod: embeddingSettings?.method,
        },
      }],
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

  // Apply cell-count-aware marker defaults for large datasets in embedding plots
  // Only applies once when config is first loaded and hasn't been customized yet
  useEffect(() => {
    if (!selectedConfig || !cellSets.accessible || plotType !== 'embedding' || !currentPlot) return;

    const initialConfig = getEmbeddingInitialConfig(currentPlot.plotType, cellSets);

    // Check if we should apply large dataset defaults
    if (initialConfig.defaultValues?.largeDatasetDefaults) {
      // Get the standard (non-adjusted) initial config to check if marker was already customized
      const standardConfig = initialPlotConfigStates[currentPlot.plotType];

      // Only apply if marker config currently matches standard defaults (not yet customized)
      const isUsingStandardDefaults = (
        selectedConfig.marker.outline === standardConfig.marker.outline
        && selectedConfig.marker.size === standardConfig.marker.size
      );

      if (isUsingStandardDefaults) {
        dispatch(updatePlotConfig(activePlotUuid, {
          marker: {
            ...selectedConfig.marker,
            outline: false,
            size: 1,
          },
        }));
        debounceSave(activePlotUuid);
      }
    }
  }, [activePlotUuid, currentPlot?.plotType, cellSets?.accessible, !!selectedConfig]);

  // Mark a plot's marker defaults "settled" once they no longer need adjusting:
  // either the dataset isn't large, or the large-dataset marker has already been
  // applied (config no longer matches the standard defaults). One-time per plot —
  // once settled it stays settled so the user can freely customise the marker.
  useEffect(() => {
    if (plotType !== 'embedding' || !selectedConfig || !cellSets.accessible
      || !currentPlot.plotType || markerSettled[activePlotUuid]) return;

    const initialConfig = getEmbeddingInitialConfig(currentPlot.plotType, cellSets);
    if (!initialConfig.defaultValues?.largeDatasetDefaults) {
      setMarkerSettled((prev) => ({ ...prev, [activePlotUuid]: true }));
      return;
    }

    const standardConfig = initialPlotConfigStates[currentPlot.plotType];
    const stillStandard = selectedConfig.marker.outline === standardConfig.marker.outline
      && selectedConfig.marker.size === standardConfig.marker.size;
    // already at the large-dataset target (covers the case where the standard
    // defaults happen to equal it, so we don't wait forever)
    const isAdjusted = selectedConfig.marker.outline === false && selectedConfig.marker.size === 1;
    // still standard (and not yet adjusted) → the adjustment effect above will
    // dispatch the change; this effect re-runs when the marker updates and settles
    if (!stillStandard || isAdjusted) {
      setMarkerSettled((prev) => ({ ...prev, [activePlotUuid]: true }));
    }
  }, [activePlotUuid, currentPlot?.plotType, cellSets.accessible,
    selectedConfig?.marker, plotType, markerSettled]);

  useEffect(() => {
    // if we change a plot and the config is not saved yet
    if (outstandingChanges) {
      dispatch(savePlotConfig(experimentId, activePlotUuid));
    }
  }, [currentPlot]);

  // When switching between embedding plots, sync marker settings across all embedding plots
  useEffect(() => {
    if (plotType !== 'embedding' || !selectedConfig?.marker) return;

    // Get all embedding plot UUIDs
    const embeddingPlotUuids = [];
    Object.values(plots).forEach(({ subPlots }) => {
      if (subPlots.embedding) {
        embeddingPlotUuids.push(subPlots.embedding.plotUuid);
      }
    });

    // Apply current plot's marker settings to all other embedding plots
    embeddingPlotUuids.forEach((plotUuid) => {
      if (plotUuid !== activePlotUuid) {
        const otherPlotConfig = plotConfigs[plotUuid];
        if (otherPlotConfig
          && JSON.stringify(otherPlotConfig.marker) !== JSON.stringify(selectedConfig.marker)) {
          dispatch(updatePlotConfig(plotUuid, { marker: selectedConfig.marker }));
        }
      }
    });
  }, [activePlotUuid, plotType, selectedConfig?.marker]);

  useEffect(() => {
    if (!selectedConfig) {
      return;
    }

    const plotActions = {
      export: true,
    };

    if (cellSets.accessible && selectedConfig) {
      setPlot(currentPlot.plot(selectedConfig, plotActions));
      setRenderedPlotUuid(activePlotUuid);
    }
  }, [selectedConfig, cellSets, cellMeta, plotType, activePlotUuid]);

  const updatePlotWithChanges = (obj) => {
    // Get all embedding plot UUIDs
    const embeddingPlotUuids = [];
    Object.values(plots).forEach(({ subPlots }) => {
      if (subPlots.embedding) {
        embeddingPlotUuids.push(subPlots.embedding.plotUuid);
      }
    });

    // If updating marker settings on an embedding plot, apply to all embedding plots
    if (plotType === 'embedding' && obj.marker) {
      embeddingPlotUuids.forEach((plotUuid) => {
        dispatch(updatePlotConfig(plotUuid, { marker: obj.marker }));
        debounceSave(plotUuid);
      });
    } else {
      // For non-marker changes, only update current plot
      dispatch(updatePlotConfig(currentPlot.plotUuid, obj));
      debounceSave(currentPlot.plotUuid);
    }
  };

  const isConfigEqual = (currentConfig, initialConfig) => {
    const removeDefaultValues = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const cleaned = { ...obj };
      delete cleaned.defaultValues;
      return cleaned;
    };

    const isEqual = Object.keys(initialConfig).every((key) => {
      // By pass plot data because we want to compare settings not data
      if (key === 'plotData') return true;
      // Skip defaultValues as it's metadata about defaults, not actual config
      if (key === 'defaultValues') return true;
      if (initialConfig.keepValuesOnReset?.includes(key)) return true;
      if (currentConfig[key] && typeof currentConfig[key] === 'object' && initialConfig[key] && typeof initialConfig[key] === 'object') {
        // For nested objects, exclude defaultValues from comparison as it's metadata about defaults
        const currentObj = removeDefaultValues(currentConfig[key]);
        const initialObj = removeDefaultValues(initialConfig[key]);
        return JSON.stringify(currentObj) === JSON.stringify(initialObj);
      }

      return currentConfig[key] === initialConfig[key];
    });

    return isEqual;
  };

  useEffect(() => {
    if (!selectedConfig || !currentPlot) return;

    const initialConfig = getEmbeddingInitialConfig(currentPlot.plotType, cellSets);
    setIsResetDisabled(isConfigEqual(selectedConfig, initialConfig));
  }, [selectedConfig, cellSets]);

  const onClickReset = () => {
    // For embedding preview plots, use cell-count-aware defaults
    const initialConfig = getEmbeddingInitialConfig(currentPlot.plotType, cellSets);
    dispatch(updatePlotConfig(currentPlot.plotUuid, initialConfig));
    debounceSave(currentPlot.plotUuid);
  };

  const renderExtraControlPanels = () => (
    <Panel header='Select data' key='select-data'>
      <SelectData
        config={selectedConfig}
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

    if (plotColouring === 'sample' && cellSets.accessible && getIsUnisample(cellSets.hierarchy)
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

    // only show the plot once it's been (re)built for the current colouring/uuid AND
    // its large-dataset marker defaults have settled — otherwise show a loader rather
    // than the previous colouring's stale plot or a flash of the un-adjusted marker
    if (plot && renderedPlotUuid === activePlotUuid
      && (plotType !== 'embedding' || markerSettled[activePlotUuid])) {
      return plot;
    }

    return (
      <center>
        <Loader />
      </center>
    );
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
        <Col span={17}>
          <center>
            {renderPlot()}
          </center>
        </Col>

        <Col span={7} style={{ minWidth: '300px' }}>
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
                <Radio.Group
                  onChange={(e) => setPlotColouring(e.target.value)}
                  value={plotColouring}
                >
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

          {Boolean(changedQCFilters.size) && (
            <Alert
              message='Your changes are not yet applied. To update the plots, click Run.'
              type='warning'
              showIcon
              style={{ marginBottom: '1rem', marginTop: '1rem' }}
            />
          )}

          <CalculationConfig experimentId={experimentId} onConfigChange={onConfigChange} />

          <Collapse>
            <Panel header='Plot options' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={selectedConfig}
                onUpdate={updatePlotWithChanges}
                extraPanels={renderExtraControlPanels()}
              />
              <Divider />
              <Button
                type='default'
                disabled={isResetDisabled}
                block
                onClick={onClickReset}
              >
                Reset Plot
              </Button>
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
  isSpatial: PropTypes.bool,
};

ConfigureEmbedding.defaultProps = {
  isSpatial: false,
};

export default ConfigureEmbedding;
