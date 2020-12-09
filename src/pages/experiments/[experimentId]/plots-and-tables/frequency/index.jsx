import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Spin,
  Radio,
} from 'antd';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import TitleDesign from '../components/TitleDesign';
import AxesDesign from '../components/AxesDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
import generateSpec from '../../../../../utils/plotSpecs/generateFrequencySpec';
import Header from '../components/Header';
import isBrowser from '../../../../../utils/environment';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/plots/index';
import PlatformError from '../../../../../components/PlatformError';
import loadCellSets from '../../../../../redux/actions/cellSets/loadCellSets';

const { Panel } = Collapse;
const plotUuid = 'frequencyPlotMain';
const plotType = 'frequency';
const route = {
  path: 'frequency',
  breadcrumbName: 'Frequency plot',
};

const frequencyPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid]?.config);
  const { loading, error } = useSelector((state) => state.cellSets);
  const properties = useSelector((state) => state.cellSets.properties);
  const router = useRouter();
  const { experimentId } = router.query;
  const [plotSpec, setPlotSpec] = useState({});
  const [plotData, setPlotData] = useState();

  useEffect(() => {
    if (!experimentId || !isBrowser) {
      return;
    }
    dispatch(loadCellSets(experimentId));

    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, [experimentId]);

  useEffect(() => {
    if (!config || Object.keys(properties).size === 0) {
      return;
    }
    setPlotSpec(generateSpec(config));
    setPlotData(generateData());
  }, [config, properties]);

  const generateData = () => {
    const data = [];
    if (!loading) {
      let i = 0;
      const sum = properties['louvain-0'].cellIds.size
        + properties['louvain-1'].cellIds.size
        + properties['louvain-2'].cellIds.size;
      let value;
      for (i = 0; i < 3; i += 1) {
        if (config.plotType === 'count') {
          value = properties[`louvain-${i}`].cellIds.size;
        } else {
          value = (properties[`louvain-${i}`].cellIds.size / sum) * 100;
        }
        data.push({
          x: 1,
          y: value,
          c: `Cluster ${i}`,
        });
      }
      return data;
    }
  };
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };
  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
        />
      );
    }
    if (!config || loading || !isBrowser) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }
    return (
      <center>
        <Vega
          spec={plotSpec}
          data={{ data: plotData }}
          renderer='canvas'
        />
      </center>
    );
  };
  const changePlotType = (value) => {
    updatePlotWithChanges({
      plotType: value.target.value,
    });
    if (value.target.value === 'proportional') {
      updatePlotWithChanges({ yaxisText: 'Proportion' });
    } else {
      updatePlotWithChanges({ yaxisText: 'Count' });
    }
  };
  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header
        plotUuid={plotUuid}
        experimentId={experimentId}
        finalRoute={route}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                {renderPlot()}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse accordion>
            <Panel header='Plot Type' key='1'>
              <Radio.Group
                onChange={(value) => changePlotType(value)}
                value={config.plotType}
              >
                <Radio value='proportional'>Proportional</Radio>
                <Radio value='count'>Count</Radio>
              </Radio.Group>
            </Panel>
            <Panel header='Main Schema' key='2'>
              <DimensionsRangeEditor
                config={config}
                onUpdate={updatePlotWithChanges}
              />
              <Collapse accordion>
                <Panel header='Define and Edit Title' key='6'>
                  <TitleDesign
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
                <Panel header='Font' key='9'>
                  <FontDesign
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
              </Collapse>
            </Panel>
            <Panel header='Axes and Margins' key='3'>
              <AxesDesign config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
            <Panel header='Legend' key='12'>
              <LegendEditor
                onUpdate={updatePlotWithChanges}
                legendEnabled={config.legendEnabled}
                legendPosition={config.legendPosition}
                legendOptions='top-bot'
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default frequencyPlot;
