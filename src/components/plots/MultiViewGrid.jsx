import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import _ from 'lodash';
import { Col, Row, Space } from 'antd';
import { getPlotConfigs, getCellSets, getGeneList } from 'redux/selectors';
import { loadCellSets } from 'redux/actions/cellSets';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import PlatformError from 'components/PlatformError';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';
import MultiViewEditor from 'components/plots/styling/MultiViewEditor';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';

const multiViewType = 'multiView';

const MultiViewGrid = (props) => {
  const {
    experimentId,
    renderPlot,
    updateAllWithChanges,
    plotType,
  } = props;
  const multiViewUuid = `${multiViewType}-${plotType}`;
  const dispatch = useDispatch();

  const cellSets = useSelector(getCellSets());

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid].config);
  const plotConfigs = useSelector(getPlotConfigs(multiViewConfig.plotUuids));
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const [selectedPlotUuid, setSelectedPlotUuid] = useState(multiViewUuid);

  const [plots, setPlots] = useState({});
  const previousMultiViewConfig = useRef({});
  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));
  const selectedConfig = plotConfigs[selectedPlotUuid];
  const geneList = useSelector(getGeneList());

  const geneNames = Object.keys(geneList.data);

  const updateMultiViewWithChanges = (updateField) => {
    dispatch(updatePlotConfig(multiViewUuid, updateField));
  };

  const resetMultiView = () => {
    updateMultiViewWithChanges({ nrows: 1, ncols: 1, plotUuids: [selectedPlotUuid] });
  };
  const loadComponent = (componentUuid, type, skipAPI, customConfig) => {
    dispatch(loadConditionalComponentConfig(
      experimentId, componentUuid, type, skipAPI, customConfig,
    ));
  };
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(selectedPlotUuid, updateField));
  };
  useEffect(() => {
    if (!multiViewConfig) {
      const customConfig = { plotUuids: [multiViewUuid] };
      loadComponent(multiViewUuid, multiViewType, false, customConfig);
      // loadComponent(plotUuid, plotType, false);
    }
  }, []);

  useEffect(() => {
    if (
      !multiViewConfig
      || _.isEqual(previousMultiViewConfig.current, multiViewConfig)
      || Object.values(plotConfigs).includes(undefined)
    ) return;
    if (!multiViewPlotUuids.includes(selectedPlotUuid)) {
      setSelectedPlotUuid(multiViewPlotUuids[0]);
    }
    // load new plots for all multi view plotUuids, with highest dispersion gene if not saved

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
      console.log('plots to add ', plotsToAdd);
      const newPlots = { ...plots };

      plotsToAdd.forEach((plotUuid) => {
        newPlots[plotUuid] = renderPlot(plotUuid, updatePlotWithChanges);
      });

      setPlots(newPlots);
    }
  }, [multiViewConfig, plotConfigs]);

  const addGeneToMultiView = (genes) => {
    const validGenes = genes.filter((gene) => geneNames.includes(gene));
    const genesToAdd = validGenes.slice(0, 30 - multiViewPlotUuids.length);

    if (genesToAdd.length === 0) return;

    const plotUuidIndexes = multiViewPlotUuids.map((uuid) => parseInt(uuid.match(/[0-9]+/g), 10));
    const newIndexes = [...Array(30).keys()].filter((index) => !plotUuidIndexes.includes(index));

    const newPlotUuids = [...multiViewPlotUuids];

    genesToAdd.forEach((gene, index) => {
      const plotUuidToAdd = generateMultiViewGridPlotUuid(multiViewUuid, newIndexes[index]);
      newPlotUuids.push(plotUuidToAdd);

      // Taking the config the user currently sees (selectedConfig),
      //  copy it and add the gene-specific settings
      const customConfig = {
        ...selectedConfig,
        shownGene: gene,
        title: { text: gene },
      };

      loadComponent(plotUuidToAdd, plotType, true, customConfig);
    });

    const multiViewUpdatedFields = { plotUuids: newPlotUuids };

    const gridSize = multiViewConfig.nrows * multiViewConfig.ncols;
    if (gridSize < newPlotUuids.length) {
      const newSize = Math.ceil(Math.sqrt(newPlotUuids.length));
      _.merge(multiViewUpdatedFields, { nrows: newSize, ncols: newSize });
    }

    updateMultiViewWithChanges(multiViewUpdatedFields);
  };
  const spaceAlign = (multiViewConfig.plotUuids.length > 1)
    ? 'start'
    : 'center';

  const renderMultiViewEditor = () => {
    console.log('his');
    return (
      <MultiViewEditor
        multiViewConfig={multiViewConfig}
        addGeneToMultiView={addGeneToMultiView}
        onMultiViewUpdate={updateMultiViewWithChanges}
        selectedPlotUuid={selectedPlotUuid}
        setSelectedPlotUuid={setSelectedPlotUuid}
        shownGenes={shownGenes}
      />
    );
  };
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
                    {plots[multiViewConfig.plotUuids[multiViewConfig.ncols * i + j]]}
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
  multiViewUuid: PropTypes.string.isRequired,
  updateAllWithChanges: PropTypes.func.isRequired,
};

export default MultiViewGrid;
