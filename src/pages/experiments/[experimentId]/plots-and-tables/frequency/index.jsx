/* eslint-disable no-param-reassign */

import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Spin,
  Radio,
  Alert,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import SelectCellSets from '../../../../../components/plots/styling/frequency/SelectCellSets';
import Header from '../../../../../components/plots/Header';

import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig/index';
import PlatformError from '../../../../../components/PlatformError';
import loadCellSets from '../../../../../redux/actions/cellSets/loadCellSets';

import FrequencyPlot from '../../../../../components/plots/FrequencyPlot';

const { Panel } = Collapse;
const plotUuid = 'frequencyPlotMain';
const plotType = 'frequency';
const route = {
  path: 'frequency',
  breadcrumbName: 'Frequency plot',
};

const frequencyPlot = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector((state) => state.cellSets);

  const {
    loading, error, hierarchy, properties,
  } = cellSets;

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, [experimentId]);

  const getCellOptions = (type) => {
    const filteredOptions = hierarchy.filter((element) => (
      properties[element.key].type === type
    ));
    if (!filteredOptions.length) {
      return [];
    }
    return filteredOptions;
  };

  const optionsMetadata = getCellOptions('metadataCategorical');
  const optionsCellSets = getCellOptions('cellSets');

  useEffect(() => {
    if (!loading && config?.proportionGrouping === '') {
      updatePlotWithChanges({
        xAxisGrouping: optionsMetadata[0]?.key,
        proportionGrouping: optionsCellSets[0].key,
      });
    }
  });

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
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
    {
      panelTitle: 'Legend',
      footer: <Alert
        message='Changing cell set colours is not currently available here.
              Use the Data Management tool in Data Exploration to customise cell set colours.'
        type='info'
      />,
      controls: [
        {
          name: 'legend',
          props: {
            option: {
              positions: 'top-bottom',
            },
          },
        },
      ],
    },
  ];

  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => loadCellSets(experimentId)}
        />
      );
    }
    if (!config || loading) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }

    return (
      <center>
        <FrequencyPlot hierarchy={hierarchy} properties={properties} config={config} />
      </center>
    );
  };
  const changePlotType = (value) => {
    updatePlotWithChanges({
      frequencyType: value.target.value,
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
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse accordion>
              <Panel header='Select Data' key='20'>
                <SelectCellSets
                  config={config}
                  onUpdate={updatePlotWithChanges}
                  optionsMetadata={optionsMetadata}
                  optionsCellSets={optionsCellSets}
                />
              </Panel>
              <Panel header='Plot Type' key='1'>
                <Radio.Group
                  onChange={(value) => changePlotType(value)}
                  value={config.frequencyType}
                >
                  <Radio value='proportional'>Proportional</Radio>
                  <Radio value='count'>Count</Radio>
                </Radio.Group>
              </Panel>
            </Collapse>
            <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

FrequencyPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default frequencyPlot;
