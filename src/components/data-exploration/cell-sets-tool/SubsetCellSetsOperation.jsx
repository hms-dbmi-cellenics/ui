import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { Tooltip, Button } from 'antd';
import { PieChartOutlined } from '@ant-design/icons';

import SubsetCellSetsModal from 'components/data-exploration/cell-sets-tool/SubsetCellSetsModal';

const SubsetCellSetsOperation = () => {
  const experimentName = useSelector((store) => store.experimentSettings.info.experimentName);
  const [showSubsetCellSets, setShowSubsetCellSets] = useState(false);

  return (
    <>
      <Tooltip placement='top' title='Subset selected cell sets to a new project.'>
        <Button
          type='dashed'
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
            showModal={showSubsetCellSets}
            onOk={(subsetExperimentName) => {
              // Send request to API here
              // createSubsetExperiment(subsetExperimentName)
              setShowSubsetCellSets(false);
            }}
            onCancel={() => setShowSubsetCellSets(false)}
          />
        )

      }
    </>
  );
};

export default SubsetCellSetsOperation;
