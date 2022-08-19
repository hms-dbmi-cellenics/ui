/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import Loader from 'components/Loader';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ViolinControls from 'components/plots/styling/violin/ViolinControls';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import ViolinPlot from 'components/plots/ViolinPlot';
import { getCellSets } from 'redux/selectors';
import { plotNames } from 'utils/constants';

const plotUuid = 'ViolinMain';
const plotType = 'violin';

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const [searchedGene, setSearchedGene] = useState(config?.shownGene);

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);

  // updateField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(plotUuid, updateField));
  };

  const plotStylingConfig = [
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
      controls: ['axesWithRanges'],
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

  const renderPlot = () => {
    if (!config) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <ViolinPlot
        searchedGene={searchedGene}
        experimentId={experimentId}
        config={config}
        plotUuid={plotUuid}
      />
    );
  };

  return (
    <>
      <Header title={plotNames.VIOLIN_PLOT} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='gene-selection'
      >
        {renderPlot()}
      </PlotContainer>
    </>
  );
};

ViolinIndex.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ViolinIndex;
