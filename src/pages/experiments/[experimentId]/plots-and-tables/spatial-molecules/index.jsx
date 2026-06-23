/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import {
  Collapse, Space, Form, Checkbox,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import MultiViewPlotEditor from 'components/plots/styling/MultiViewPlotEditor';
import MultiViewPlotGrid from 'components/plots/MultiViewPlotGrid';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import GeneSearchBar from 'components/plots/GeneSearchBar';
import ColorPicker from 'components/ColorPicker';
import SliderWithInput from 'components/SliderWithInput';
import SpatialMoleculeReduxWrapper from 'components/plots/SpatialMoleculeReduxWrapper';

import { updatePlotConfig } from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import loadGeneList from 'redux/actions/genes/loadGeneList';
import { getCellSets, getPlotConfigs } from 'redux/selectors';
import { plotNames, plotUuids, plotTypes } from 'utils/constants';

const { Panel } = Collapse;

const plotUuid = plotUuids.SPATIAL_MOLECULES;
const plotType = plotTypes.SPATIAL_MOLECULES;
const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);

const SpatialMoleculesPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const cellSets = useSelector(getCellSets());

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));

  const [selectedPlotUuid, setSelectedPlotUuid] = useState(`${plotUuid}-0`);
  const [updateAll, setUpdateAll] = useState(true);

  // config of the plot currently selected in the multi-view editor; the molecule
  // panels (genes / segmentation) read from it and write to it (or to all plots).
  const selectedConfig = plotConfigs[selectedPlotUuid];

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
    // gene list powers the search bar + default-gene selection
    dispatch(loadGeneList(experimentId));
  }, []);

  const sampleCellSets = {
    ...cellSets,
    hierarchy: cellSets.hierarchy.filter((item) => item.key === 'sample'),
  };

  const updateAllWithChanges = (updateField) => {
    (multiViewPlotUuids ?? []).forEach((uuid) => {
      dispatch(updatePlotConfig(uuid, updateField));
    });
  };
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(selectedPlotUuid, updateField));
  };
  const onUpdate = updateAll ? updateAllWithChanges : updatePlotWithChanges;

  // Reset every plot's STYLING back to defaults while keeping the grid layout and
  // each plot's selected genes / colours / sample (the keepValuesOnReset fields).
  const resetAllPlotStyles = () => {
    const defaultConfig = initialPlotConfigStates[plotType];
    const keysToPreserve = defaultConfig.keepValuesOnReset || [];
    (multiViewPlotUuids ?? []).forEach((uuid) => {
      const current = plotConfigs[uuid];
      const resetConfig = keysToPreserve.reduce((acc, key) => {
        if (current?.[key] !== undefined) acc[key] = current[key];
        return acc;
      }, _.cloneDeep(defaultConfig));
      dispatch(updatePlotConfig(uuid, resetConfig));
    });
  };

  const renderPlot = (plotUuidToRender) => (
    <SpatialMoleculeReduxWrapper
      experimentId={experimentId}
      plotUuid={plotUuidToRender}
    />
  );

  const plotStylingConfig = [
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        { panelTitle: 'Title', controls: ['title'] },
        { panelTitle: 'Font', controls: ['font'] },
      ],
    },
    { panelTitle: 'Axes options', controls: [{ name: 'axes', props: { showOffset: false } }] },
    { panelTitle: 'Colour inversion', controls: ['colourInversion'] },
    {
      panelTitle: 'Markers',
      controls: [{
        name: 'markers',
        props: {
          showShapeType: false, pointSizeMin: 0.1, pointSizeMax: 10, pointSizeStep: 0.1,
        },
      }],
    },
    {
      panelTitle: 'Legend',
      controls: [{ name: 'legend', props: { option: { positions: 'top-bottom' } } }],
    },
  ];

  const selectedGenes = selectedConfig?.selectedGenes ?? [];
  const geneColors = selectedConfig?.geneColors ?? {};

  const addGenes = (genes) => {
    onUpdate({ selectedGenes: Array.from(new Set([...selectedGenes, ...genes])) });
  };

  const removeGene = (gene) => {
    const nextColors = { ...geneColors };
    delete nextColors[gene];
    onUpdate({
      selectedGenes: selectedGenes.filter((g) => g !== gene),
      geneColors: nextColors,
    });
  };

  const setGeneColor = (gene, color) => {
    onUpdate({ geneColors: { ...geneColors, [gene]: color } });
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <p>
          Choose which transcript molecules to show. A few genes are selected by
          default; add or remove genes to compare their spatial distributions.
        </p>
        <GeneSearchBar
          allowMultiple
          genesToDisable={selectedGenes}
          onSelect={addGenes}
          buttonText='Add'
        />
        <Space direction='vertical' size={[0, 8]} style={{ marginTop: '0.5em', width: '100%' }}>
          {selectedGenes.map((gene) => (
            <Space key={gene}>
              <ColorPicker
                // key on the colour so the swatch re-mounts (ColorPicker captures its
                // colour in state at mount) when the per-gene colour is seeded/changed.
                key={geneColors[gene] ?? 'unset'}
                color={geneColors[gene] ?? '#cccccc'}
                onColorChange={(color) => setGeneColor(gene, color)}
              />
              <span>{gene}</span>
              <CloseOutlined
                aria-label={`remove ${gene}`}
                onClick={() => removeGene(gene)}
                style={{ cursor: 'pointer' }}
              />
            </Space>
          ))}
        </Space>
      </Panel>
      <Panel header='View multiple plots' key='view-multiple-plots' collapsible={false}>
        <MultiViewPlotEditor
          plotType={plotType}
          experimentId={experimentId}
          plotUuid={plotUuid}
          selectedPlotUuid={selectedPlotUuid}
          setSelectedPlotUuid={setSelectedPlotUuid}
          updateAll={updateAll}
          setUpdateAll={setUpdateAll}
        />
      </Panel>
      <Panel header='Segmentation outlines' key='segmentations'>
        <Form size='small'>
          <p><strong>Outline Opacity:</strong></p>
          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SliderWithInput
                min={0}
                max={1}
                step={0.01}
                value={selectedConfig?.segmentationOutlineOpacity ?? 0.05}
                onUpdate={(val) => onUpdate({ segmentationOutlineOpacity: val })}
                sliderWidth={150}
              />
              <ColorPicker
                key={selectedConfig?.segmentationOutlineColour ?? '#CECBCB'}
                color={selectedConfig?.segmentationOutlineColour ?? '#CECBCB'}
                onColorChange={(color) => onUpdate({ segmentationOutlineColour: color })}
                size='small'
              />
              <Checkbox
                checked={selectedConfig?.showSegmentationOutlines ?? true}
                onChange={(e) => onUpdate({ showSegmentationOutlines: e.target.checked })}
              />
            </div>
          </Form.Item>
        </Form>
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          // read/write the selected plot's own config so the sample can be set
          // per-plot in the multi-view (falls back to the container config pre-load)
          config={selectedConfig || multiViewConfig}
          plotType={plotType}
          onUpdate={onUpdate}
          cellSets={sampleCellSets}
          showImageToggle={false}
        />
      </Panel>
    </>
  );

  return (
    <>
      <Header title={plotNames.SPATIAL_MOLECULES} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={selectedPlotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='gene-selection'
        onPlotReset={resetAllPlotStyles}
        onUpdate={onUpdate}
      >
        <MultiViewPlotGrid
          experimentId={experimentId}
          renderPlot={renderPlot}
          updateAllWithChanges={updateAllWithChanges}
          plotType={plotType}
          plotUuid={plotUuid}
        />
      </PlotContainer>
    </>
  );
};

SpatialMoleculesPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default SpatialMoleculesPage;
