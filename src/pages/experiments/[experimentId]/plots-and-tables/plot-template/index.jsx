/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Tooltip,
  Button,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ViolinControls from 'components/plots/styling/violin/ViolinControls';
import PlotStyling from 'components/plots/styling/PlotStyling';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import PlotHeader from 'components/plots/PlotHeader';
import ViolinPlot from 'components/plots/ViolinPlot';
import { getCellSets } from 'redux/selectors';
import { plotNames } from 'utils/constants';

const { Panel } = Collapse;
// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'ViolinMain';
const plotType = 'violin';

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const [searchedGene, setSearchedGene] = useState(config?.shownGene);

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
      panelTitle: 'Axes and margins',
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

  const renderExtraPanels = () => (
    <ViolinControls
      config={config}
      onUpdate={updatePlotWithChanges}
      setSearchedGene={setSearchedGene}
      cellSets={cellSets}
    />
  );

  return (
    <>
      <PlotHeader
        title={plotNames.VIOLIN_PLOT}
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
                  {config
                    && (
                      <ViolinPlot
                        searchedGene={searchedGene}
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
                defaultActiveKey='gene-selection'
              />
            </Space>
          </Col>
        </Row>
      </Space>
    </>
  );
};

ViolinIndex.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ViolinIndex;
