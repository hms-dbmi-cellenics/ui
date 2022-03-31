import React from 'react';
import PropTypes from 'prop-types';
import Header from 'components/Header';

import PlotsTablesContainer from 'pages/experiments/[experimentId]/plots-and-tables/PlotsTablesContainer';
import SingleTileContainer from 'components/SingleTileContainer';

const PlotsTablesHome = (props) => {
  const { experimentId, experimentData } = props;

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        title='Plots and Tables'
      />
      <SingleTileContainer title='Select Plot'>
        <PlotsTablesContainer experimentId={experimentId} />
      </SingleTileContainer>
    </>
  );
};

PlotsTablesHome.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
};

export default PlotsTablesHome;
