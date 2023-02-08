/* eslint-disable no-param-reassign */
import React, { useEffect, useRef } from 'react';
import _ from 'lodash';
import {
  Collapse,
  Select,
  Skeleton,
  Space,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { getCellSets, getCellSetsHierarchy, getCellSetsHierarchyByKeys } from 'redux/selectors';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import Header from 'components/Header';
import { loadCellSets } from 'redux/actions/cellSets';
import Loader from 'components/Loader';
import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import PlotContainer from 'components/plots/PlotContainer';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import PlotLegendAlert, { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';
import { plotNames } from 'utils/constants';

const { Panel } = Collapse;

const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';

const EmbeddingCategoricalPage = ({ experimentId }) => {
  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const configIsLoaded = useSelector((state) => !_.isNil(state.componentConfig[plotUuid]));

  const cellSets = useSelector(getCellSets());
  const numLegendItems = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  )[0]?.children?.length;
  const hierarchy = useSelector(getCellSetsHierarchy());

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  useEffect(() => {
    if (!configIsLoaded
      || !cellSets.accessible
      || !config.legend.enabled) return;

    const showAlert = numLegendItems > MAX_LEGEND_ITEMS;

    if (showAlert) updatePlotWithChanges({ legend: { showAlert, enabled: !showAlert } });
  }, [configIsLoaded, cellSets.accessible]);

  const generateGroupByOptions = () => {
    if (!cellSets.accessible) {
      return [];
    }
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children.length} ${children === 1 ? 'child' : 'children'})`,
    }));
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
      panelTitle: 'Axes and margins',
      controls: ['axesWithRanges'],
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
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
      </Panel>
      <Panel header='Group by' key='group-by'>
        <p>
          Select the cell set category you would like to group cells by.
        </p>
        {config ? (
          <Select
            labelInValue
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            value={{ value: config.selectedCellSet }}
            options={generateGroupByOptions()}
            onChange={({ value }) => updatePlotWithChanges({ selectedCellSet: value })}
          />
        ) : <Skeleton.Input style={{ width: '100%' }} active />}
      </Panel>
    </>
  );

  const render = () => {
    if (!cellSets.accessible || !config) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <Space direction='vertical'>
        {config?.legend?.showAlert && <PlotLegendAlert />}
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={config}
          plotUuid={plotUuid}
          onUpdate={updatePlotWithChanges}
        />
      </Space>
    );
  };

  return (
    <>
      <Header title={plotNames.CATEGORICAL_EMBEDDING} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='group-by'
      >
        { render() }
      </PlotContainer>
    </>
  );
};
EmbeddingCategoricalPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingCategoricalPage;
