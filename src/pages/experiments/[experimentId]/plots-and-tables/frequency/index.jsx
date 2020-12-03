/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Search,
  Skeleton,
  Spin,
  Button,
} from 'antd';
import _ from 'lodash';
import { CSVLink } from 'react-csv';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PointDesign from '../components/PointDesign';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import TitleDesign from '../components/TitleDesign';
import AxesDesign from '../components/AxesDesign';
import FontDesign from '../components/FontDesign';
import ColourInversion from '../components/ColourInversion';
import ColourbarDesign from '../components/ColourbarDesign';
import LegendEditor from '../components/LegendEditor';
import generateSpec from '../../../../../utils/plotSpecs/generateFrequencySpec';
import Header from '../components/Header';
import DiffExprCompute from '../../data-exploration/components/differential-expression-tool/DiffExprCompute';
import isBrowser from '../../../../../utils/environment';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/plots/index';
import PlatformError from '../../../../../components/PlatformError';

const { Panel } = Collapse;
const plotUuid = 'frequencyPlotMain';
const plotType = 'frequency';
const route = {
  path: 'frequency',
  breadcrumbName: 'Frequency plot',
};

const frequencyPlot = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { experimentId } = router.query;

  const config = useSelector((state) => state.plots[plotUuid]?.config);
  const [plotData, setPlotData] = useState([]);
  const [spec, setSpec] = useState({
    spec: null,
  });
  useEffect(() => {
    if (!isBrowser) return;
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, [experimentId]);

  useEffect(() => {
    if (!config) return;
    const generatedSpec = generateSpec(config, plotData);
    setSpec(generatedSpec);
  }, [config]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const renderPlot = () => (
    <center>
      <Vega
        spec={generateSpec(config, 'Variable')}
        renderer='canvas'
      />
    </center>
  );

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
            <Panel header='Colours' key='10'>
              <ColourbarDesign
                config={config}
                onUpdate={updatePlotWithChanges}
              />
              <Collapse accordion>
                <Panel header='Colour Inversion' key='4'>
                  <ColourInversion
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
              </Collapse>
            </Panel>
            <Panel header='Markers' key='11'>
              <PointDesign config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
            <Panel header='Legend' key='12'>
              <LegendEditor
                onUpdate={updatePlotWithChanges}
                legendEnabled={config.legendEnabled}
                legendPosition={config.legendPosition}
                legendOptions='corners'
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default frequencyPlot;
