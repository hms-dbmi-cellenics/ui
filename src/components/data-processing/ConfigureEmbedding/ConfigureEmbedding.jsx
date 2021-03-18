import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Collapse, Empty, Alert,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';

import CalculationConfig from './CalculationConfig';
import MiniPlot from '../../plots/MiniPlot';

import CategoricalEmbeddingPlot from '../../plots/CategoricalEmbeddingPlot';
import DoubletScoresPlot from '../../plots/DoubletScoresPlot';
import MitochondrialContentPlot from '../../plots/MitochondrialContentPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import PlotStyling from '../../plots/styling/PlotStyling';
import { filterCells } from '../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { updateCellSetsClustering } from '../../../redux/actions/cellSets';
import Loader from '../../Loader';

const { Panel } = Collapse;

const ConfigureEmbedding = (props) => {
  const { experimentId } = props;
  const [selectedPlot, setSelectedPlot] = useState('sample');
  const [plot, setPlot] = useState(null);
  const cellSets = useSelector((state) => state.cellSets);

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
    sample: {
      title: 'Colored by Samples',
      plotUuid: 'embeddingPreviewBySample',
      plotType: 'embeddingPreviewBySample',
      plot: (config, plotData, actions) => (
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    cellCluster: {
      title: 'Colored by CellSets',
      plotUuid: 'embeddingPreviewByCellSets',
      plotType: 'embeddingPreviewByCellSets',
      plot: (config, plotData, actions) => (
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    mitochondrialContent: {
      title: 'Mitochondrial fraction reads',
      plotUuid: 'embeddingPreviewMitochondrialContent',
      plotType: 'embeddingPreviewMitochondrialContent',
      plot: (config, plotData, actions) => (
        <MitochondrialContentPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    doubletScores: {
      title: 'Cell doublet score',
      plotUuid: 'embeddingPreviewDoubletScore',
      plotType: 'embeddingPreviewDoubletScore',
      plot: (config, plotData, actions) => (
        <DoubletScoresPlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
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
      panelTitle: 'Axes and Margins',
      controls: ['axes'],
    },
    ...plotSpecificStylingControl[selectedPlot],
  ];

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
      setPlot(plots[selectedPlot].plot(config, plotData));
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
          <CalculationConfig experimentId={experimentId} />
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

ConfigureEmbedding.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ConfigureEmbedding;
