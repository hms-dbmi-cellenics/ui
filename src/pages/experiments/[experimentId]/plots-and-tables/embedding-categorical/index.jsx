/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Select,
  Tooltip,
  Button,
  Skeleton,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { getCellSets, getCellSetsHierarchy } from 'redux/selectors';
import PlotStyling from 'components/plots/styling/PlotStyling';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import PlotHeader from 'components/plots/PlotHeader';
import { loadCellSets } from 'redux/actions/cellSets';
import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';

const { Panel } = Collapse;

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';

const route = {
  path: 'embedding-categorical',
  breadcrumbName: 'Categorical Embedding',
};

const EmbeddingCategoricalPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const hierarchy = useSelector(getCellSetsHierarchy());
  useEffect(() => {
    // try to load the plot configuration.
    dispatch(loadCellSets(experimentId));
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  const generateGroupByOptions = () => {
    if (cellSets.loading) {
      return [];
    }
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children.length} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onCellSetSelect = ({ value }) => {
    updatePlotWithChanges({ selectedCellSet: value });
  };

  const plotStylingControlsConfig = [
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
      panelTitle: 'Axes and margins',
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
    {
      panelTitle: 'Labels',
      controls: ['labels'],
    },
  ];

  const renderExtraPanels = () => (
    <>
      <Panel header='Select data' key='15'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
      </Panel>
      <Panel header='Group by' key='1'>
        <p>
          Select the cell set category you would like to group cells by.
        </p>
        {config ? (
          <Select
            labelInValue
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            loading={config}
            value={{ value: config.selectedCellSet }}
            options={generateGroupByOptions()}
            onChange={onCellSetSelect}
          />
        ) : <Skeleton.Input style={{ width: '100%' }} active />}
      </Panel>
    </>
  );

  return (
    <>
      <PlotHeader
        plotUuid={plotUuid}
        experimentId={experimentId}
      />
      <Space direction='vertical' style={{ width: '100%', padding: '0 10px' }}>

        <Row gutter={16}>
          <Col span={16}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Collapse defaultActiveKey='1'>
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
                    onUpdate={updatePlotWithChanges}
                  />
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
                defaultActiveKey='1'
              />
            </Space>
          </Col>
        </Row>
      </Space>
    </>
  );
};
EmbeddingCategoricalPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingCategoricalPage;
