/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Tooltip,
  Input,
  Button,
  Skeleton,
  Form,
  Slider,
  Radio,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import SelectData from '../../../../../components/plots/styling/violin/SelectData';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig/index';
import { loadCellSets } from '../../../../../redux/actions/cellSets';
import Header from '../../../../../components/plots/Header';
import ViolinPlot from '../../../../../components/plots/ViolinPlot';

const { Panel } = Collapse;
const { Search } = Input;

const route = {
  path: 'violin',
  breadcrumbName: 'Violin',
};

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'ViolinMain';
const plotType = 'violin';

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector((state) => state?.cellSets);
  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);

  // updateField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(plotUuid, updateField));
  };

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: [{
            name: 'title',
            props: {
              placeHolder: 'Gene name if empty',
            },
          }],
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
    {
      panelTitle: 'Markers',
      controls: ['violinMarkers'],
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
  ];

  const changeDisplayedGene = (geneName) => {
    updatePlotWithChanges({
      shownGene: geneName,
      title: { text: '' },
    });
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene Selection' key='666'>
        {config ? (
          <Search
            style={{ width: '100%' }}
            enterButton='Search'
            defaultValue={config.shownGene}
            onSearch={(val) => changeDisplayedGene(val)}
          />
        ) : <Skeleton.Input style={{ width: 200 }} active />}
      </Panel>
      <Panel header='Select Data' key='15'>
        {config && !cellSets.loading && !cellSets.error ? (
          <SelectData
            config={config}
            onUpdate={updatePlotWithChanges}
            cellSets={cellSets}
          />
        ) : <Skeleton.Input style={{ width: 200 }} active />}
      </Panel>
      <Panel header='Data Transformation' key='16'>
        {config ? (
          <div>
            {false // Control removed until we are able to get the raw values
              && (
                <Form.Item>
                  <p>Transform Gene Expression</p>
                  <Radio.Group
                    onChange={(e) => updatePlotWithChanges({ normalised: e.target.value })}
                    value={config.normalised}
                  >
                    <Radio value='normalised'>Normalised</Radio>
                    <Radio value='raw'>Raw values</Radio>
                  </Radio.Group>
                </Form.Item>
              )}
            <Form.Item label='Bandwidth Adjustment'>
              <Slider
                value={config.kdeBandwidth}
                min={0}
                max={1}
                onChange={(val) => updatePlotWithChanges({ kdeBandwidth: val })}
                step={0.05}
              />
            </Form.Item>
          </div>
        ) : <Skeleton.Input style={{ width: 200 }} active />}
      </Panel>
    </>
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
              <Panel
                header='Preview'
                key='1'
                extra={(
                  <Tooltip title='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'>
                    <Button icon={<InfoCircleOutlined />} />
                  </Tooltip>
                )}
              >
                {config
                  && (
                    <ViolinPlot
                      experimentId={experimentId}
                      config={config}
                      plotUuid={plotUuid}
                    />
                  )}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

ViolinIndex.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ViolinIndex;
