/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
} from '../../../redux/actions/componentConfig';

import PlotStyling from '../../plots/styling/PlotStyling';
import { filterCells } from '../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadCellSets } from '../../../redux/actions/cellSets';

const { Panel } = Collapse;

const ConfigureEmbedding = (props) => {
  const { experimentId } = props;
  const [selectedPlot, setSelectedPlot] = useState('sample');
  const [plot, setPlot] = useState(false);
  const cellSets = useSelector((state) => state.cellSets);

  const dispatch = useDispatch();

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

  const config = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, [experimentId]);

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

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
  };

  const renderPlot = () => {
    // Spinner for main window
    if (!config) {
      return (
        <center>
          <Spin size='large' />
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
            <Tooltip title='The number of dimensions used to configure the embedding is set here. This dictates the number of clusters in the Uniform Manifold Approximation and Projection (UMAP) which is taken forward to the ‘data exploration’ page.'>
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
