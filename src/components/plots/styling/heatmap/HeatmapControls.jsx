import React from 'react';
import {
  Collapse, Select, Space, Button,
} from 'antd';
import PropTypes from 'prop-types';
import HeatmapGroupBySettings from '../../../data-exploration/heatmap/HeatmapGroupBySettings';
import HeatmapMetadataTracksSettings from '../../../data-exploration/heatmap/HeatmapMetadataTrackSettings';
import HeatmapExpressionValuesSettings from '../../../data-exploration/heatmap/HeatmapExpressionValuesSettings';

const { Panel } = Collapse;

const HeatmapControls = (props) => {
  const {
    config, onGeneEnter, generateCellSetOptions, onCellSetSelect, plotUuid,
  } = props;
  console.log('something');
  return (
    <Collapse defaultActiveKey={['5']} accordion>
      <Panel header='Gene selection' key='5'>
        <p>Type in a gene name and hit space or enter to add it to the heatmap.</p>
        <Space direction='vertical' style={{ width: '100%' }}>
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
            onClick={() => onGeneEnter([])}
          >
            Reset
          </Button>
        </Space>
      </Panel>
      <Panel header='Expression values' key='10'>
        <HeatmapExpressionValuesSettings componentType={plotUuid} />
      </Panel>
      <Panel header='Metadata tracks' key='11'>
        <HeatmapMetadataTracksSettings componentType={plotUuid} />
      </Panel>
      <Panel header='Group by' key='12'>
        <HeatmapGroupBySettings componentType={plotUuid} />
      </Panel>
      {/* <Panel header='Group by' key='6'>
        <p>Select the cell set category you would like to group cells by.</p>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Select
            labelInValue
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            value={{ key: config.selectedCellSet }}
            options={generateCellSetOptions()}
            onChange={onCellSetSelect}
          />
        </Space>
      </Panel> */}
    </Collapse>

  );
};

HeatmapControls.propTypes = {
  config: PropTypes.object.isRequired,
  onGeneEnter: PropTypes.func.isRequired,
  generateCellSetOptions: PropTypes.func.isRequired,
  onCellSetSelect: PropTypes.func.isRequired,
  plotUuid: PropTypes.string.isRequired,
};
export default HeatmapControls;
