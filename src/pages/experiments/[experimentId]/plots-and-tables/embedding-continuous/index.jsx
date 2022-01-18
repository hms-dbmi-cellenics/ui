/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import {
  Row, Col, Space, Collapse,
} from 'antd';

import _ from 'lodash';

import PlotStyling from 'components/plots/styling/PlotStyling';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadGeneExpression, loadPaginatedGeneProperties } from 'redux/actions/genes';
import PlotHeader from 'components/plots/PlotHeader';
import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';
import SingleGeneSelection from 'components/plots/styling/SingleGeneSelection';
import { getCellSets } from 'redux/selectors';

const { Panel } = Collapse;

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingContinuousMain';
const plotType = 'embeddingContinuous';

const ContinuousEmbeddingPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const loadedGene = useSelector((state) => state.genes.expression.views[plotUuid]?.data);
  const cellSets = useSelector(getCellSets());
  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);

  const geneExpression = useSelector((state) => state.genes.expression);
  const fetching = useSelector((state) => state.genes.properties.views[plotUuid]?.fetching);
  const highestDispersionGene = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.data[0],
  );

  const PROPERTIES = ['dispersions'];
  const tableState = {
    pagination: {
      current: 1, pageSize: 1, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
  };

  const [searchedGene, setSearchedGene] = useState();

  useEffect(() => {
    if (!_.isNil(config?.shownGene) && !searchedGene) {
      // Loads expression for saved gene in the config in the initial loading of the plot
      // if a new gene wasn't searched for
      dispatch(loadGeneExpression(experimentId, [config.shownGene], plotUuid));
    }
  }, [config?.shownGene]);

  useEffect(() => {
    if (loadedGene && loadedGene.length) {
      updatePlotWithChanges({ shownGene: loadedGene[0] });
    }
  }, [loadedGene]);

  useEffect(() => {
    if (searchedGene) {
      dispatch(loadGeneExpression(experimentId, [searchedGene], plotUuid));
    }
  }, [searchedGene]);

  if (config?.shownGene === null && !fetching && !highestDispersionGene) {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  }

  useEffect(() => {
    if (config?.shownGene === null && highestDispersionGene) {
      updatePlotWithChanges({ shownGene: highestDispersionGene });
      dispatch(loadGeneExpression(experimentId, [highestDispersionGene], plotUuid));
    }
  }, [highestDispersionGene, config]);

  // updateField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(plotUuid, updateField));
  };

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Expression values',
      controls: ['expressionValuesCapping'],
    },
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
      panelTitle: 'Colours',
      controls: ['colourScheme', 'colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <SingleGeneSelection
          config={config}
          setSearchedGene={setSearchedGene}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
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
                <Panel header='Preview' key='1'>
                  <ContinuousEmbeddingPlot
                    experimentId={experimentId}
                    config={config}
                    plotUuid={plotUuid}
                    plotData={
                    geneExpression.data[config?.shownGene]?.rawExpression.expression
                    }
                    truncatedPlotData={
                    geneExpression.data[config?.shownGene]?.truncatedExpression.expression
                    }
                    loading={geneExpression.loading.length > 0}
                    error={geneExpression.error}
                    reloadPlotData={() => loadGeneExpression(
                      experimentId, [config?.shownGene], plotUuid,
                    )}
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
                defaultActiveKey='gene-selection'
              />
            </Space>
          </Col>
        </Row>
      </Space>
    </>
  );
};

ContinuousEmbeddingPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ContinuousEmbeddingPage;
