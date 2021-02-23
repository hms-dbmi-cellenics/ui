/* eslint-disable dot-notation */
/* eslint-disable no-param-reassign */
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Spin, Collapse, Empty, Alert,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import plot1Pic from '../../../../static/media/plot9.png';
import plot2Pic from '../../../../static/media/plot10.png';
import CalculationConfig from './CalculationConfig';

import CategoricalEmbeddingPlot from '../../plots/CategoricalEmbeddingPlot';
import ContinuousEmbeddingPlot from '../../plots/ContinuousEmbeddingPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import PlotStyling from '../../plots/styling/PlotStyling';
import { filterCells } from '../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadCellSets } from '../../../redux/actions/cellSets';
import Loader from '../../Loader';

const { Panel } = Collapse;

const ConfigureEmbedding = (props) => {
  const { experimentId } = props;
  const [selectedPlot, setSelectedPlot] = useState('sample');
  const [plot, setPlot] = useState(false);
  const cellSets = useSelector((state) => state.cellSets);
  const router = useRouter();
  const dispatch = useDispatch();
  const debounceSave = useCallback(_.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), []);

  const plots = {
    sample: {
      title: 'Colored by Samples',
      imgSrc: plot1Pic,
      plotUuid: 'embeddingPreviewBySample',
      plotType: 'embeddingPreviewBySample',
      plot: (config) => (<CategoricalEmbeddingPlot experimentId={experimentId} config={config} plotUuid='embeddingPreviewBySample' />),
    },

    cellCluster: {
      title: 'Colored by CellSets',
      imgSrc: plot1Pic,
      plotUuid: 'embeddingPreviewByCellSets',
      plotType: 'embeddingPreviewByCellSets',
      plot: (config) => (<CategoricalEmbeddingPlot experimentId={experimentId} config={config} plotUuid='embeddingPreviewByCellSets' />),
    },
    mitochondrialFraction: {
      title: 'Mitochondrial fraction reads',
      imgSrc: plot2Pic,
      plotUuid: 'embeddingPreviewMitochondrialReads',
      plotType: 'embeddingPreviewMitochondrialReads',
      plot: (config) => (<ContinuousEmbeddingPlot experimentId={experimentId} config={config} plotUuid='embeddingPreviewMitochondrialReads' />),
    },
    doubletScore: {
      title: 'Cell doublet score',
      imgSrc: plot2Pic,
      plotUuid: 'embeddingPreviewDoubletScore',
      plotType: 'embeddingPreviewDoubletScore',
      plot: (config) => (<ContinuousEmbeddingPlot experimentId={experimentId} config={config} plotUuid='embeddingPreviewDoubletScore' />),
    },
  };
  const outstandingChanges = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.outstandingChanges);

  const config = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
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
    if (!config) {
      return;
    }

    if (!cellSets.loading && !cellSets.error && config) {
      setPlot(plots[selectedPlot].plot(config));
    }
  }, [config, cellSets]);

  useEffect(() => {
    const { plotUuid, plotType } = plots[selectedPlot];

    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [selectedPlot]);

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

  const plotSpecificStyling = {
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
    mitochondrialFraction: [
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
    doubletScore: [
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

ConfigureEmbedding.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ConfigureEmbedding;
