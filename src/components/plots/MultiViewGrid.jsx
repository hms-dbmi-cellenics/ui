import React, {
  useEffect, useState, useRef, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import _ from 'lodash';
import { Col, Row, Space } from 'antd';
import { getPlotConfigs, getCellSets } from 'redux/selectors';
import { loadCellSets } from 'redux/actions/cellSets';
import {
  updatePlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig/index';

import PlatformError from 'components/PlatformError';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';
import Loader from 'components/Loader';
import { loadPaginatedGeneProperties, loadGeneExpression } from 'redux/actions/genes';
import { plotTypes, plotUuids } from 'utils/constants';

const PROPERTIES = ['dispersions'];

const tableState = {
  pagination: {
    current: 1, pageSize: 1000000, showSizeChanger: true,
  },
  geneNamesFilter: null,
  sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
};

const multiViewType = plotTypes.MULTI_VIEW_PLOT;

const MultiViewGrid = (props) => {
  const {
    experimentId,
    renderPlot,
    updateAllWithChanges,
    plotType,
    plotUuid,
  } = props;
  const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);
  const dispatch = useDispatch();

  const cellSets = useSelector(getCellSets());

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const plotConfigs = useSelector(getPlotConfigs(multiViewConfig?.plotUuids));
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const firstPlotUuid = `${plotUuid}-0`;

  const [plots, setPlots] = useState({});
  const previousMultiViewConfig = useRef({});
  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));
  const highestDispersionGene = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.data[0],
  );

  const debounceSaveAll = useCallback(_.debounce(() => {
    const allComponentUuids = _.concat(multiViewUuid, multiViewPlotUuids);
    allComponentUuids.forEach((uuid) => {
      if (uuid) {
        dispatch(savePlotConfig(experimentId, uuid));
      }
    });
  }, 2000), [multiViewConfig]);
  const expression = useSelector((state) => state.genes.expression.full);

  const loadComponent = (componentUuid, type, skipAPI, customConfig) => {
    dispatch(loadConditionalComponentConfig(
      experimentId, componentUuid, type, skipAPI, customConfig,
    ));
  };

  useEffect(() => {
    if (!highestDispersionGene) {
      dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
    }
    if (!multiViewConfig) {
      loadComponent(multiViewUuid, multiViewType, false);
    }
  }, []);

  useEffect(() => {
    if (!multiViewConfig) return;

    debounceSaveAll();
  }, [plotConfigs, multiViewConfig]);

  useEffect(() => {
    if (plotConfigs[firstPlotUuid]
      && !plotConfigs[firstPlotUuid]?.shownGene
      && highestDispersionGene) {
      dispatch(updatePlotConfig(firstPlotUuid,
        { shownGene: highestDispersionGene, title: { text: highestDispersionGene } }));
    }
  }, [plotConfigs, highestDispersionGene]);

  useEffect(() => {
    // initial set up if there are no plots
    // plotting one plot using the highest dispersion gene

    if ((multiViewConfig && highestDispersionGene && !multiViewPlotUuids?.length)) {
      dispatch(loadGeneExpression(experimentId, [highestDispersionGene], firstPlotUuid));

      const customMultiPlotConfig = { plotUuids: [firstPlotUuid] };
      loadComponent(multiViewUuid, multiViewType, true, customMultiPlotConfig);

      const customFirstPlotConfig = { shownGene: highestDispersionGene, title: { text: highestDispersionGene } };
      loadComponent(firstPlotUuid, plotType, true, customFirstPlotConfig);
    }
  }, [multiViewConfig, highestDispersionGene, plotConfigs]);

  useEffect(() => {
    if (!shownGenes?.length) return;

    const genesToLoad = shownGenes.filter((gene) => (
      gene && !expression.matrix.geneIsLoaded(gene)
    ));
    if (genesToLoad.length > 0) {
      dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    }
  }, [shownGenes, expression]);

  useEffect(() => {
    if (
      !multiViewConfig
      || _.isEqual(previousMultiViewConfig.current, multiViewConfig)
    ) return;
    multiViewPlotUuids.forEach((uuid) => {
      if (!plotConfigs[uuid]) {
        loadComponent(uuid, plotType, false);
      }
    });
    const previousPlotUuids = previousMultiViewConfig.current.plotUuids ?? [];
    const currentPlotUuids = multiViewConfig.plotUuids;

    previousMultiViewConfig.current = multiViewConfig;

    // if new plots are added
    if (currentPlotUuids.length > previousPlotUuids.length) {
      // when adding the second plot rescale all to fit
      if (previousPlotUuids.length === 1) {
        updateAllWithChanges({ dimensions: { width: 550, height: 400 } });
      }

      const plotsToAdd = _.difference(currentPlotUuids, previousPlotUuids);
      const newPlots = { ...plots };

      plotsToAdd.forEach((uuid) => {
        newPlots[uuid] = renderPlot(uuid);
      });
      setPlots(newPlots);
    }
  }, [multiViewConfig, plotConfigs]);

  const spaceAlign = (multiViewConfig?.plotUuids?.length > 1)
    ? 'start'
    : 'center';

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          reason={cellSets.error}
          onClick={() => {
            dispatch(loadCellSets(experimentId));
          }}
        />
      );
    }
    if (!multiViewConfig) {
      // Render loading state or handle error
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }
    return (
      <Space
        direction='vertical'
        align={spaceAlign}
        id='multiViewContainer'
        style={{ width: '100%', height: '100%' }}
      >
        {
          _.times(multiViewConfig.nrows, (i) => (
            <Row wrap={false} key={i}>
              {
                _.times(multiViewConfig.ncols, (j) => (
                  <Col flex key={multiViewConfig.ncols * i + j}>
                    {plots[multiViewConfig.plotUuids[multiViewConfig.ncols * i + j]] ?? <div />}
                  </Col>
                ))
              }
            </Row>
          ))
        }
      </Space>
    );
  };
  return render();
};

MultiViewGrid.propTypes = {
  experimentId: PropTypes.string.isRequired,
  renderPlot: PropTypes.func.isRequired,
  updateAllWithChanges: PropTypes.func.isRequired,
  plotType: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
};

export default MultiViewGrid;
