import React from 'react';
import PropTypes from 'prop-types';
import Header from 'components/Header';

import PlotsTablesContainer from 'pages/experiments/[experimentId]/plots-and-tables/PlotsTablesContainer';
import SingleTileContainer from 'components/SingleTileContainer';

const PLOTS_TABLES = 'Select Plot';

const windows = PLOTS_TABLES;

const PlotsTablesHome = ({ experimentId, experimentData }) => {
  const TILE_MAP = {
    [PLOTS_TABLES]: {
      toolbarControls: [],
      component: (width, height) => (
        <PlotsTablesContainer
          width={width}
          height={height}
          experimentId={experimentId}
        />
      ),
    },
  };

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        title='Plots and Tables'
      />
      <SingleTileContainer
        tileMap={TILE_MAP}
        initialArrangement={windows}
      />
    </>
  );
};

PlotsTablesHome.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
};

export default PlotsTablesHome;
