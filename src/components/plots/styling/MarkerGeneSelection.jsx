import React, { useState, useEffect } from 'react';
import propTypes from 'prop-types';
import {
  Space,
  Radio,
  InputNumber,
  Select,
  Button,
} from 'antd';

const MarkerGeneSelection = (props) => {
  const { config, onUpdate, onReset } = props;
  const [numGenes, setNumGenes] = useState(config.nMarkerGenes);
  const [genesLoaded, setGenesLoaded] = useState(true);

  useEffect(() => {
    if (numGenes === config.numGenes) {
      setGenesLoaded(true);
    } else if (numGenes !== config.numGenes && genesLoaded) {
      setGenesLoaded(false);
    }
  }, [config.numGenes, numGenes]);

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
              disabled={genesLoaded}
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
        <p>Type in a gene name and hit space or enter to add it to the heatmap.</p>
        <Select
          mode='tags'
          style={{ width: '100%' }}
          placeholder='Select genes...'
          onChange={(genes) => onUpdate({ selectedGenes: genes })}
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
  onReset: propTypes.func,
};

MarkerGeneSelection.defaultProps = {
  onReset: () => {},
};

export default MarkerGeneSelection;
