import React, { useState } from 'react';
import propTypes from 'prop-types';
import {
  Space,
  Radio,
  InputNumber,
  Select,
  Button,
} from 'antd';

const MarkerGeneSelection = (props) => {
  const {
    config, onUpdate, onReset, onGeneEnter,
  } = props;
  const [numGenes, setNumGenes] = useState(config.nMarkerGenes);

  const renderOptions = () => {
    if (!config.useMarkerGenes) {
      return (
        <Space direction='vertical' size='small'>
          <p>Type in a gene name and hit space or enter to add it to the heatmap.</p>
          <Select
            mode='tags'
            style={{ width: '100%' }}
            placeholder='Select genes...'
            onChange={onGeneEnter}
            value={config.selectedGenes}
            tokenSeparators={[' ']}
            notFoundContent='No gene added yet.'
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
    }

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
  onGeneEnter: propTypes.func.isRequired,
  onReset: propTypes.func.isRequired,
};

export default MarkerGeneSelection;
