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
import {
  generateSamplePlotSpec,
  generateCellSetClusterPlotSpec,
  generateMitochondrialFractionReadsSpec,
  generateDoubletScorePlotSpec,
} from '../../../../../../utils/plotSpecs/generateEmbeddingPreviewSpec';

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
  const [config, setConfig] = useState({});

  const error = false;

  const plots = {
    sample: {
      title: 'group by sample',
      specGenerator: generateSamplePlotSpec,
      imgSrc: plot1Pic,
    },
    cellCluster: {
      title: 'default clusters',
      specGenerator: generateCellSetClusterPlotSpec,
      imgSrc: plot2Pic,
    },
    mitochondrialFraction: {
      title: 'mitochondrial fraction reads',
      specGenerator: generateMitochondrialFractionReadsSpec,
      imgSrc: plot1Pic,
    },
    doubletScore: {
      title: 'cell doublet score',
      specGenerator: generateDoubletScorePlotSpec,
      imgSrc: plot2Pic,
    },
  };

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!Object.keys(config).length) {
      setConfig(initialPlotConfigStates.embeddingPreview);
    }

    const spec = plots[selectedSpec].specGenerator(config);

    // Add data to spec
    generateData(spec);
    setPlotSpec(spec);
  }, [selectedSpec, config]);

  // Replace this function when data source for embedding preview is available
  const generateData = (spec) => {
    spec.data.forEach((s) => {
      s.values = s.name === 'embeddingCat' ? UMAP : '';
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
          onClick={() => {}}
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

  return (
    <>
      <PageHeader
        title={config ? `Embedding preview (${config.plotTitle})` : ''}
        subTitle='Powerful data exploration'
        style={{ width: '100%', paddingRight: '0px' }}
      />
      <Row>
        <Col span={15}>
          { renderPlot() }
        </Col>

        <Col span={3}>
          <Space direction='vertical'>
            <Tooltip title='The number of dimensions used to configure the embedding is set here. This dictates the number of clusters in the Uniform Manifold Approximation and Projection (UMAP) which is taken forward to the ‘data exploration’ page.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>

            { Object.entries(plots).map(([key, plot]) => (
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
