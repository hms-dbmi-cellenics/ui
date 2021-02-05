/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Spin, Collapse, Empty,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import plot1Pic from '../../../../../../../static/media/plot9.png';
import plot2Pic from '../../../../../../../static/media/plot10.png';
import CalculationConfig from './CalculationConfig';

import CategoricalEmbeddingPlot from './CategoricalEmbeddingPlot';
import ContinuousEmbeddingPlot from './ContinuousEmbeddingPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../../redux/actions/componentConfig';

import isBrowser from '../../../../../../utils/environment';
import DimensionsRangeEditor from '../../../plots-and-tables/components/DimensionsRangeEditor';
import ColourbarDesign from '../../../plots-and-tables/components/ColourbarDesign';
import ColourInversion from '../../../plots-and-tables/components/ColourInversion';
import AxesDesign from '../../../plots-and-tables/components/AxesDesign';
import PointDesign from '../../../plots-and-tables/components/PointDesign';
import TitleDesign from '../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../plots-and-tables/components/FontDesign';
import LegendEditor from '../../../plots-and-tables/components/LegendEditor';
import LabelsDesign from '../../../plots-and-tables/components/LabelsDesign';
import { filterCells } from '../../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';

const { Panel } = Collapse;

const EmbeddingPreview = () => {
  const router = useRouter();
  const { experimentId } = router.query;
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

  const config = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config);

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
    if (!isBrowser) return;
    const { plotUuid, plotType } = plots[selectedPlot];

    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [selectedPlot]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
  };

  const renderPlot = () => {
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

  // Spinner for main window
  if (!config) {
    return (
      <center>
        <Spin size='large' />
      </center>
    );
  }

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
              <Collapse accordion>
                <Panel header='Main Schema' key='main-schema'>
                  <DimensionsRangeEditor config={config} onUpdate={updatePlotWithChanges} />
                  <Collapse accordion>
                    <Panel header='Define and Edit Title' key='title'>
                      <TitleDesign config={config} onUpdate={updatePlotWithChanges} />
                    </Panel>
                    <Panel header='Font' key='font'>
                      <FontDesign config={config} onUpdate={updatePlotWithChanges} />
                    </Panel>
                  </Collapse>
                </Panel>
                <Panel header='Axes and Margins' key='axes'>
                  <AxesDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
                {plots[selectedPlot].plotType === 'embeddingContinuous' && (
                  <Panel header='Colours' key='colors'>
                    <ColourbarDesign config={config} onUpdate={updatePlotWithChanges} />
                    <ColourInversion config={config} onUpdate={updatePlotWithChanges} />
                  </Panel>
                )}
                {plots[selectedPlot].plotType === 'embeddingCategorical' && (
                  <Panel header='Colour inversion'>
                    <ColourInversion config={config} onUpdate={updatePlotWithChanges} />
                  </Panel>
                )}
                <Panel header='Markers' key='marker'>
                  <PointDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
                {plots[selectedPlot].plotType === 'embeddingContinuous' && (
                  <Panel header='Legend' key='legend'>
                    <LegendEditor config={config} onUpdate={updatePlotWithChanges} />
                  </Panel>
                )}
                {plots[selectedPlot].plotType === 'embeddingCategorical' && (
                  <Panel header='Legend' key='legend'>
                    <LegendEditor config={config} onUpdate={updatePlotWithChanges} option={{ position: 'top-bottom' }} />
                  </Panel>
                )}

                <Panel header='Labels' key='labels'>
                  <LabelsDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
              </Collapse>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

EmbeddingPreview.defaultProps = {
};

EmbeddingPreview.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingPreview;
