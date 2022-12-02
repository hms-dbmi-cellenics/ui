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
      <Tooltip placement='top' title='Subset selected cell sets to a new analysis.'>
        <Button
          type='dashed'
          aria-label='Subset cellsets'
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
              console.log('*** subsetExperimentName', subsetExperimentName);
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
