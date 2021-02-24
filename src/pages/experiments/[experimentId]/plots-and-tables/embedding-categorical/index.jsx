/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Select,
  Spin,
  Tooltip,
  Button,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig/index';
import Header from '../../../../../components/plots/Header';
import { loadCellSets } from '../../../../../redux/actions/cellSets';
import CategoricalEmbeddingPlot from '../../../../../components/plots/CategoricalEmbeddingPlot';

const { Panel } = Collapse;

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';

const route = {
  path: 'embedding-categorical',
  breadcrumbName: 'Categorical Embedding',
};

const EmbeddingCategoricalIndex = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector((state) => state.cellSets);
  useEffect(() => {
    // try to load the plot configuration.
    dispatch(loadCellSets(experimentId));
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, [experimentId]);

  const generateCellSetOptions = () => {
    if (cellSets.loading) {
      return [];
    }

    const hierarchy = cellSets.hierarchy.map((cellSet) => ({
      key: cellSet.key,
      children: cellSet.children?.length || 0,
    }));
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onCellSetSelect = ({ value }) => {
    updatePlotWithChanges({ selectedCellSet: value });
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
      panelTitle: 'Colour Inversion',
      controls: ['colourInversion'],
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
  ];
  if (!config || cellSets.loading) {
    return (
      <center>
        <Spin size='large' />
      </center>
    );
  }
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
                <CategoricalEmbeddingPlot
                  experimentId={experimentId}
                  config={config}
                  plotUuid={plotUuid}
                />
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse accordion defaultActiveKey={['1']}>
              <Panel header='Group by' key='1'>
                <p>
                  Select the cell set category you would like to group cells by.
                </p>
                <Select
                  labelInValue
                  style={{ width: '100%' }}
                  placeholder='Select cell set...'
                  value={{ key: config.selectedCellSet }}
                  options={generateCellSetOptions()}
                  onChange={onCellSetSelect}
                />
              </Panel>
            </Collapse>
            <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
          </Space>
        </Col>
      </Row>
    </div>
  );
};
EmbeddingCategoricalIndex.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingCategoricalIndex;
