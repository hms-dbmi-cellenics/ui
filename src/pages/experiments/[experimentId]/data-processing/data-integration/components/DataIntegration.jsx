import React, { useState } from 'react';
import {
  Row, Col, Button, Tooltip, Space, Collapse, Alert,
} from 'antd';
import _ from 'lodash';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/router';

import CalculationConfig from './CalculationConfig';
import ElbowPlot from './plots/ElbowPlot';

import DimensionsRangeEditor from '../../../plots-and-tables/components/DimensionsRangeEditor';
import cellBySamplePic from '../../../../../../../static/media/plot9.png';
import frequencyPic from '../../../../../../../static/media/frequency.png';
import elbowPic from '../../../../../../../static/media/elbow.png';
import AxesDesign from '../../../plots-and-tables/components/AxesDesign';
import PointDesign from '../../../plots-and-tables/components/PointDesign';
import TitleDesign from '../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../plots-and-tables/components/FontDesign';
import LegendEditor from '../../../plots-and-tables/components/LegendEditor';
import LabelsDesign from '../../../plots-and-tables/components/LabelsDesign';
import ColourInversion from '../../../plots-and-tables/components/ColourInversion';

const defaultStylingConfig = {
  legendEnabled: 'true',
  legendPosition: 'top',
  labelsEnabled: true,
  labelSize: 28,
  xAxisText: 'Principal Components',
  yAxisText: 'Proportion of Variance Explained',
  xDefaultTitle: 'Principal Components',
  yDefaultTitle: 'Proportion of Variance Explained',
  titleSize: 12,
  titleText: 'Scree plot',
  titleDx: 10,
  titleAnchor: 'start',
  masterFont: 'sans-serif',
  masterSize: 13,
  xaxisText: 'Principal Components',
  yaxisText: 'Proportion of Variance Explained',
  axisTitlesize: 13,
  axisTicks: 13,
  axisOffset: 0,
  transGrid: 10,
  width: 530,
  height: 400,
  maxWidth: 720,
  maxHeight: 530,
  pointSize: 5,
  pointOpa: 5,
  pointStyle: 'circle',
  toggleInvert: '#FFFFFF',
};

const { Panel } = Collapse;

const DataIntegration = () => {
  const router = useRouter();
  const { experimentId } = router.query;

  const [selectedPlot, setSelectedPlot] = useState('sample');

  const [config, setConfig] = useState(defaultStylingConfig);

  const updatePlotWithChanges = (configUpdates) => {
    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, configUpdates);

    setConfig(newConfig);
  };

  const plots = {
    sample: {
      title: 'Samples',
      imgSrc: cellBySamplePic,
      specifics: () => (
        <>
          <Panel header='Colours' key='colors'>
            <ColourInversion
              config={config}
              onUpdate={updatePlotWithChanges}
            />
            <Alert
              message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
              type='info'
            />
          </Panel>

          <Panel header='Legend' key='legend'>
            <LegendEditor
              onUpdate={updatePlotWithChanges}
              legendEnabled={config.legendEnabled}
              legendPosition={config.legendPosition}
              legendOptions='top-bot'
            />
          </Panel>
          <Panel header='Markers' key='marker'>
            <PointDesign config={config} onUpdate={updatePlotWithChanges} />
          </Panel>
          <Panel header='Labels' key='labels'>
            <LabelsDesign config={config} onUpdate={updatePlotWithChanges} />
          </Panel>
        </>
      ),
    },
    frequency: {
      title: 'Default clusters',
      imgSrc: frequencyPic,
      specifics: () => (
        <>
          <Panel header='Colours' key='colors'>
            <ColourInversion
              config={config}
              onUpdate={updatePlotWithChanges}
            />
            <Alert
              message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
              type='info'
            />
          </Panel>
          <Panel header='Legend' key='legend'>
            <LegendEditor
              onUpdate={updatePlotWithChanges}
              legendEnabled={config.legendEnabled}
              legendPosition={config.legendPosition}
              legendOptions='top-bot'
            />
          </Panel>
        </>
      ),
    },
    elbow: {
      title: 'Mitochondrial fraction reads',
      imgSrc: elbowPic,
      specifics: () => (
        <>
          <Panel header='Colours' key='colors'>
            <ColourInversion
              config={config}
              onUpdate={updatePlotWithChanges}
            />
          </Panel>
        </>
      ),
    },
  };

  return (
    <>
      <Row>
        <Col span={14}>
          <ElbowPlot config={config} />
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
                onClick={() => setSelectedPlot(key)}
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

        <Col span={7}>
          <Collapse defaultActiveKey={['data-integration']}>
            <Panel header='Data Integration' key='data-integration'>
              <CalculationConfig experimentId={experimentId} />
            </Panel>
            <Panel header='Plot Styling' key='styling'>
              <Collapse accordion>
                <Panel header='Main Schema' key='main-schema'>
                  <DimensionsRangeEditor
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                  <Collapse accordion>
                    <Panel header='Define and Edit Title' key='title'>
                      <TitleDesign
                        config={config}
                        onUpdate={updatePlotWithChanges}
                      />
                    </Panel>
                    <Panel header='Font' key='font'>
                      <FontDesign
                        config={config}
                        onUpdate={updatePlotWithChanges}
                      />
                    </Panel>
                  </Collapse>
                </Panel>
                <Panel header='Axes and Margins' key='axes'>
                  <AxesDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
                {plots[selectedPlot].specifics()}

              </Collapse>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

export default DataIntegration;
