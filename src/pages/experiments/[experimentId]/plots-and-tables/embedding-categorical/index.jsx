/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row,
  Col,
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
import Header from 'components/Header';
import { loadCellSets } from 'redux/actions/cellSets';
import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import PlotContainer from 'components/plots/PlotContainer';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import { plotNames } from 'utils/constants';

const { Panel } = Collapse;

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';

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
      <Panel header='Select data' key='Select data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
      </Panel>
      <Panel header='Group by' key='Group by'>
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
      <Header title={plotNames.CATEGORICAL_EMBEDDING} />
      <div style={{ width: '100%', padding: '0 16px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <PlotContainer
              experimentId={experimentId}
              plotUuid={plotUuid}
              plotType={plotType}
              plotInfo='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'
            >
              <CategoricalEmbeddingPlot
                experimentId={experimentId}
                config={config}
                plotUuid={plotUuid}
                onUpdate={updatePlotWithChanges}
              />
            </PlotContainer>
          </Col>
          <Col span={8}>
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActivePanel='Group by'
            />
          </Col>
        </Row>
      </div>
    </>
  );
};
EmbeddingCategoricalPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingCategoricalPage;
