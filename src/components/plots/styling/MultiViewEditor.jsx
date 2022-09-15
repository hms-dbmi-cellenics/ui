import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Skeleton,
  Space,
  Select,
  Input,
} from 'antd';
import { arrayMoveImmutable } from 'utils/array-move';
import HierarchicalTreeGenes from '../hierarchical-tree-genes/HierarchicalTreeGenes';

const { Search } = Input;

const MultiViewEditor = (props) => {
  const { multiViewConfig, addGeneToMultiView, onMultiViewUpdate, setSelectedPlot } = props;

  if (!multiViewConfig) {
    return (
      <div data-testid='skeletonInput'>
        <Skeleton.Input style={{ width: 200 }} active />
      </div>
    );
  }

  const [localShownGene, setLocalShownGene] = useState('');

  const options = multiViewConfig.plotUuids.map((plotUuid) => ({ value: plotUuid }));

  const treeData = multiViewConfig.plotUuids.map((plotUuid, index) => ({ key: index, title: plotUuid }));

  const onGeneReorder = (key, newPosition) => {
    console.log(key);
    console.log(newPosition);
    const newPlotUuids = arrayMoveImmutable(multiViewConfig.plotUuids, key, newPosition);
    console.log(newPlotUuids);

    onMultiViewUpdate({ plotUuids: newPlotUuids });
  };

  return (
    <Space direction='vertical'>
      <Search
        aria-label='addMultiViewGene'
        style={{ width: '100%' }}
        enterButton='Add'
        value={localShownGene}
        onChange={(e) => { setLocalShownGene(e.target.value); }}
        onSearch={(val) => addGeneToMultiView(val)}
      />
      <Select
        defaultValue={options[0].value}
        options={options}
        onChange={(value) => setSelectedPlot(value)}
      />
      <HierarchicalTreeGenes
        treeData={treeData}
        onGeneReorder={onGeneReorder}
      />
    </Space>
  );
};

MultiViewEditor.propTypes = {
  multiViewConfig: PropTypes.object.isRequired,
  addGeneToMultiView: PropTypes.func.isRequired,
  onMultiViewUpdate: PropTypes.func.isRequired,
  setSelectedPlot: PropTypes.func.isRequired,
};

export default MultiViewEditor;
