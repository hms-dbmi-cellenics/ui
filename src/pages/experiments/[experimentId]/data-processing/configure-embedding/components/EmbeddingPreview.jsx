import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Spin,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plot1Pic from '../../../../../../../static/media/plot9.png';
import plot2Pic from '../../../../../../../static/media/plot10.png';
import PlotStyling from '../../filter-cells/components/PlotStyling';
import CalculationConfig from './CalculationConfig';
import UMAP from './new_data.json';

import PlatformError from '../../../../../../components/PlatformError';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../../redux/actions/componentConfig';
import { initialPlotConfigStates } from '../../../../../../redux/reducers/componentConfig/initialState';
import generateEmbeddingCategoricalSpec from '../../../../../../utils/plotSpecs/generateDataProcessingEmbeddingCategoricalSpec';
import generateEmbeddingContinuousSpec from '../../../../../../utils/plotSpecs/generateDataProcessingEmbeddingContinuousSpec';
import colorProvider from '../../../../../../utils/colorProvider';

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
// const plotUuid = 'embeddingCategoricalMain';
// const plotType = 'embeddingCategorical';
// const embeddingType = 'umap';

const EmbeddingPreview = () => {
  const dispatch = useDispatch();

  const router = useRouter();
  const { experimentId } = router.query;
  const [selectedSpec, setSelectedSpec] = useState('sample');
  const [plotSpec, setPlotSpec] = useState({});
  const [config, setConfig] = useState(null);

  const error = false;

  const plots = {
    sample: {
      title: 'Samples',
      initialConfig: initialPlotConfigStates.dataProcessingEmbeddingCategorical,
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
    },
    cellCluster: {
      title: 'Default clusters',
      initialConfig: initialPlotConfigStates.dataProcessingEmbeddingCategorical,
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
    },
    mitochondrialFraction: {
      title: 'Mitochondrial fraction reads',
      initialConfig: initialPlotConfigStates.embeddingContinuous,
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
    },
    doubletScore: {
      title: 'Cell doublet score',
      initialConfig: initialPlotConfigStates.embeddingContinuous,
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
    },
  };

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.

    if (!config) {
      return;
    }

    const spec = plots[selectedSpec].specGenerator(config);
    generateData(spec);
    console.log(config, spec);
    setPlotSpec(spec);
  }, [config]);

  useEffect(() => {
    setConfig(plots[selectedSpec].initialConfig);
  }, [selectedSpec]);

  // Quick and dirty function to massage prepared data into a good shape.
  // This will be changed once we actually load data from Redux.
  const generateData = (spec) => {
    spec.data.map((s) => {
      if (s.name === 'cellSets') {
        s.values = [];

        UMAP.forEach((cell, i) => {
          s.values[cell.cluster_id] = {
            name: `${cell.cluster_id}`,
            cellSetId: cell.cluster_id,
            cellIds: s.values[cell.cluster_id]?.cellIds ? [...s.values[cell.cluster_id].cellIds, i] : [i],
            color: colorProvider.getColor(),
          };
          // cluster_id
        });
      }

      if (s.name === 'expression') {
        s.values = { expression: UMAP.map((cell) => cell.doubletScore || 0) };
      }

      if (s.name === 'embedding') {
        s.values = UMAP.map((cell) => [cell.UMAP_1, cell.UMAP_2]);
      }
    });
  };

  const updatePlotWithChanges = (obj) => {
    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, obj);
    setConfig(newConfig);
  };

  const renderPlot = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => { }}
        />
      );
    }

    if (!config) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' />
      </center>
    );
  };

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
        title={plots[selectedSpec].title}
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

            {Object.entries(plots).map(([key, plot]) => (
              <button
                type='button'
                key={key}
                onClick={() => setSelectedSpec(key)}
                style={{
                  padding: 0, margin: 0, border: 0, backgroundColor: 'transparent',
                }}
              >
                <img
                  alt={plot.title}
                  src={plot.imgSrc}
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
          <PlotStyling
            config={config}
            onUpdate={updatePlotWithChanges}
            updatePlotWithChanges={updatePlotWithChanges}
            legendMenu
          />
        </Col>
      </Row>
    </>
  );
};

export default EmbeddingPreview;
