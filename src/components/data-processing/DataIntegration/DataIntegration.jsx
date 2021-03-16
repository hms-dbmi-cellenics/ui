import React, {
  useState, useEffect, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Collapse, Empty, Alert,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import Loader from '../../Loader';

import CalculationConfig from './CalculationConfig';

import { loadCellSets, updateCellSetsClustering } from '../../../redux/actions/cellSets';

import plot1Pic from '../../../../static/media/plot9.png';
import plot2Pic from '../../../../static/media/plot10.png';
import PlotStyling from '../../plots/styling/PlotStyling';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import CategoricalEmbeddingPlot from '../../plots/CategoricalEmbeddingPlot';
import FrequencyPlot from '../../plots/FrequencyPlot';
import ElbowPlot from '../../plots/ElbowPlot';

const { Panel } = Collapse;
const DataIntegration = (props) => {
  const { experimentId } = props;
  const [selectedPlot, setSelectedPlot] = useState('embedding');
  const [plot, setPlot] = useState(false);
  const cellSets = useSelector((state) => state.cellSets);

  const router = useRouter();
  const dispatch = useDispatch();
  const debounceSave = useCallback(_.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), []);

  const debouncedCellSetClustering = useCallback(
    _.debounce((resolution) => dispatch(updateCellSetsClustering(experimentId, resolution)), 2000),
    [],
  );

  const plots = {
    embedding: {
      title: 'Sample plot',
      imgSrc: plot1Pic,
      plotUuid: 'dataIntegrationEmbedding',
      plotType: 'dataIntegrationEmbedding',
      plot: (config, plotData) => (<CategoricalEmbeddingPlot experimentId={experimentId} config={config} plotData={plotData} />),
    },
    frequency: {
      title: 'Frequency plot',
      imgSrc: plot1Pic,
      plotUuid: 'dataIntegrationFrequency',
      plotType: 'dataIntegrationFrequency',
      plot: (config, plotData) => (<FrequencyPlot experimentId={experimentId} config={config} plotData={plotData} />),
    },
    elbow: {
      title: 'Elbow plot',
      imgSrc: plot2Pic,
      plotUuid: 'dataIntegrationElbow',
      plotType: 'dataIntegrationElbow',
      plot: (config, plotData) => (<ElbowPlot experimentId={experimentId} config={config} plotData={plotData} />),
    },
  };

  const plotSpecificStyling = {
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

  const plotStylingConfig = [
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
    ...plotSpecificStyling[selectedPlot],
  ];

  const outstandingChanges = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.outstandingChanges);

  const config = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );

  const plotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, [experimentId]);

  useEffect(() => {
    const { plotUuid, plotType } = plots[selectedPlot];

    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }

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

    if (!cellSets.loading && !cellSets.error && !cellSets.updateCellSetsClustering && config && plotData) {
      setPlot(plots[selectedPlot].plot(config, plotData));
      if (!config.selectedCellSet) { return; }

      const propertiesArray = Object.keys(cellSets.properties);
      const cellSetClusteringLength = propertiesArray.filter((cellSet) => cellSet === config.selectedCellSet).length;

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

    router.events.on('routeChangeStart', showPopupWhenUnsaved);

    return () => {
      router.events.off('routeChangeStart', showPopupWhenUnsaved);
    };
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
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    if (selectedPlot === 'sample'
      && !cellSets.loading
      && filterCells(cellSets, config.selectedCellSet).length === 0) {
      return (
        <Empty description='Your project has only one sample.' />
      );
    }

    if (plot) {
      return plot;
    }
  };

  const getMiniaturizedConfig = (miniaturesConfig, updatedWidth) => {
    const {
      width, height, axisTicks, ...configWithoutSize
    } = miniaturesConfig;

    const miniPlotConfig = _.cloneDeep(configWithoutSize);

    miniPlotConfig.axes.titleFontSize = 5;
    miniPlotConfig.axes.labelFontSize = 5;

    miniPlotConfig.dimensions.width = updatedWidth;
    miniPlotConfig.dimensions.height = updatedWidth * 0.8;

    miniPlotConfig.legend.enabled = false;

    miniPlotConfig.title.fontSize = 5;

    if (miniPlotConfig.label) {
      miniPlotConfig.label.enabled = false;
    }

    if (miniPlotConfig.marker.size) {
      miniPlotConfig.marker.size = 1;
    }

    if (miniPlotConfig.signals) { miniPlotConfig.signals[0].bind = undefined; }

    return miniPlotConfig;
  };

  const miniaturesColumn = (
    <ReactResizeDetector handleWidth handleHeight>
      {({ width: updatedWidth }) => (
        <Col span={4}>
          <Space direction='vertical' align='center' style={{ marginLeft: '0px', marginRight: '0px' }}>
            {Object.entries(plots).map(([key, value]) => (
              <button
                type='button'
                key={key}
                onClick={() => { setActivePlotKey(key); }}
                style={{
                  padding: 0, margin: 0, border: 0, backgroundColor: 'transparent',
                }}
              >
                {
                  renderIfAvailable(
                    (loadedConfig) => (
                      plots[key].renderPlot(
                        getMiniaturizedConfig(loadedConfig, updatedWidth),
                        false,
                      )
                    ),
                    value.persistedConfig,
                  )
                }
              </button>
            ))}
          </Space>
        </Col>
      )}
    </ReactResizeDetector>
  );

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
            <Tooltip title='The number of dimensions used to configure the embedding is set here. This dictates the number of clusters in the Uniform Manifold Approximation and Projection (UMAP) which is taken forward to the ‘Data Exploration’ page.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>

            {Object.entries(plots).map(([key, option]) => (
              <button
                type='button'
                key={key}
                onClick={() => setSelectedPlot(key)}
                style={{
                  padding: 0, margin: 0, border: 0, backgroundColor: 'transparent',
                }}
              >
                <img
                  alt={option.title}
                  src={option.imgSrc}
                  style={{
                    height: '100px',
                    width: '100px',
                    align: 'center',
                    padding: '8px',
                    border: '1px solid #000',
                  }}
                />
              </button>

            ))}
          </Space>
        </Col>

        <Col span={5}>
          <CalculationConfig experimentId={experimentId} />
          <Collapse>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

DataIntegration.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default DataIntegration;
