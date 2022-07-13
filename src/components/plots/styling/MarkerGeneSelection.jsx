import React, { useState } from 'react';
import propTypes from 'prop-types';
import {
  Space,
  Radio,
  InputNumber,
  Button,
} from 'antd';

import GeneReorderTool from 'components/plots/GeneReorderTool';
import GeneSearchBar from 'components/plots/GeneSearchBar';

const MarkerGeneSelection = (props) => {
  const {
    config, plotUuid, searchBarUuid, onUpdate, onReset, onDataChange,
  } = props;
  const [numGenes, setNumGenes] = useState(config.nMarkerGenes);

  const renderOptions = () => {
    if (config.useMarkerGenes) {
      return (
        <div>
          <p>Number of marker genes per cluster</p>
          <Space direction='horizontal' size='small'>
            <InputNumber
              aria-label='Number of genes input'
              size='small'
              value={numGenes}
              onChange={(value) => setNumGenes(value)}
            />
            <Button
              onClick={() => onUpdate({ nMarkerGenes: numGenes })}
              disabled={numGenes === config.nMarkerGenes}
              type='primary'
              size='small'
            >
              Run
            </Button>
          </Space>
        </div>
      );
    }

    return (
      <Space direction='vertical' size='small'>
        <p>Type in a gene name and select it to add it to the heatmap. Drag and drop genes to re-order them.</p>
        <GeneSearchBar
          plotUuid={plotUuid}
          searchBarUuid={searchBarUuid}
          onSelect={onDataChange}
        />
        <GeneReorderTool
          plotUuid={plotUuid}
          onDelete={onDataChange}
        />
        <Button
          type='primary'
          onClick={onReset}
          size='small'
        >
          Reset
        </Button>
      </Space>
    );
  };

  return (
    <>
      <Space direction='vertical' size='middle'>
        <Radio.Group
          onChange={(e) => onUpdate({ useMarkerGenes: e.target.value })}
          value={config.useMarkerGenes}
        >
          <Radio value={false}>Custom genes</Radio>
          <Radio value>Marker genes</Radio>
        </Radio.Group>
        {renderOptions()}
      </Space>
    </>
  );
};

MarkerGeneSelection.propTypes = {
  onUpdate: propTypes.func.isRequired,
  config: propTypes.object.isRequired,
  onReset: propTypes.func.isRequired,
  plotUuid: propTypes.string.isRequired,
  searchBarUuid: propTypes.string.isRequired,
  onDataChange: propTypes.func.isRequired,
};

export default MarkerGeneSelection;
