import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';

import { Tooltip, Button } from 'antd';
import { PieChartOutlined } from '@ant-design/icons';

import SubsetCellSetsModal from 'components/data-exploration/cell-sets-tool/SubsetCellSetsModal';
import { sampleTech } from 'utils/constants';

const SubsetCellSetsOperation = (props) => {
  const { onCreate } = props;

  const firstSampleId = useSelector((store) => store.experimentSettings.info.sampleIds[0]);
  const experimentName = useSelector((store) => store.experimentSettings.info.experimentName);
  const experimentType = useSelector((store) => store.samples[firstSampleId]?.type);

  const [showSubsetCellSets, setShowSubsetCellSets] = useState(false);

  return (
    <>
      <Tooltip placement='top' title='Subset selected cell sets to a new project.'>
        <Button
          type='dashed'
          disabled={experimentType === sampleTech.SEURAT}
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
