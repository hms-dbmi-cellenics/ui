import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';

import { Tooltip, Button } from 'antd';
import { PieChartOutlined } from '@ant-design/icons';

import SubsetCellSetsModal from 'components/data-exploration/cell-sets-tool/SubsetCellSetsModal';
import { obj2sTechs, spatialTechs } from 'utils/constants';

const SubsetCellSetsOperation = (props) => {
  const { onCreate } = props;

  const firstSampleId = useSelector((store) => store.experimentSettings.info.sampleIds[0]);
  const experimentName = useSelector((store) => store.experimentSettings.info.experimentName);
  const experimentType = useSelector((store) => store.samples[firstSampleId]?.type);

  const [showSubsetCellSets, setShowSubsetCellSets] = useState(false);

  // Subsetting is unavailable for spatial technologies (e.g. visium_hd, xenium)
  // until the spatial subsetting semantics (segmentations/coords/image) are
  // defined. Obj2s techs remain disabled as before.
  const isSpatial = spatialTechs.includes(experimentType);
  const subsetDisabled = obj2sTechs.includes(experimentType) || isSpatial;

  return (
    <>
      <Tooltip
        placement='top'
        title={isSpatial
          ? 'Subsetting is not available for spatial technologies.'
          : 'Subset selected cell sets to a new project.'}
      >
        <Button
          type='dashed'
          disabled={subsetDisabled}
          aria-label='Create new experiment from selected cellsets'
          size='small'
          icon={<PieChartOutlined />}
          onClick={() => { setShowSubsetCellSets(true); }}
        />
      </Tooltip>

      {
        showSubsetCellSets && (
          <SubsetCellSetsModal
            experimentName={experimentName}
            onOk={(subsetName) => {
              onCreate(subsetName);
              setShowSubsetCellSets(false);
            }}
            onCancel={() => setShowSubsetCellSets(false)}
          />
        )
      }
    </>
  );
};

SubsetCellSetsOperation.propTypes = {
  onCreate: PropTypes.func.isRequired,
};

export default SubsetCellSetsOperation;
