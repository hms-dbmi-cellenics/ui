import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Header from 'components/Header';

import PlotsTablesContainer from 'components/plots/PlotsTablesContainer';
import SingleTileContainer from 'components/SingleTileContainer';
import { spatialTechs } from 'utils/constants';

const PlotsTablesHome = (props) => {
  const { experimentId, experimentData } = props;

  const samples = useSelector((state) => state.samples);
  const selectedTechnology = (samples[experimentData?.sampleIds?.[0]]?.type || false);

  const isSpatial = spatialTechs.includes(selectedTechnology);

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        title='Plots and Tables'
      />
      <SingleTileContainer>
        <PlotsTablesContainer experimentId={experimentId} isSpatial={isSpatial} />
      </SingleTileContainer>
    </>
  );
};

PlotsTablesHome.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
};

export default PlotsTablesHome;
