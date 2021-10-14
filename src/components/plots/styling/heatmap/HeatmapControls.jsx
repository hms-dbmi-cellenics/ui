import React from 'react';
import {
  Collapse, Select, Space, Button,
} from 'antd';
import PropTypes from 'prop-types';
import HeatmapGroupBySettings from '../../../data-exploration/heatmap/HeatmapGroupBySettings';
import HeatmapMetadataTracksSettings from '../../../data-exploration/heatmap/HeatmapMetadataTrackSettings';

const { Panel } = Collapse;

const HeatmapControls = (props) => {
  const {
    onGeneEnter, plotUuid, selectedGenes,
    onReset = () => onGeneEnter([]),
  } = props;

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
            value={selectedGenes}
            tokenSeparators={[' ']}
            notFoundContent='No gene added yet.'
          />

          <Button
            type='primary'
            onClick={onReset}
          >
            Reset
          </Button>
        </Space>
      </Panel>
      <Panel header='Metadata tracks' key='metadataTracks'>
        <HeatmapMetadataTracksSettings componentType={plotUuid} />
      </Panel>
      <Panel header='Group by' key='groupBy'>
        <HeatmapGroupBySettings componentType={plotUuid} />
      </Panel>
    </Collapse>

  );
};

HeatmapControls.propTypes = {
  onGeneEnter: PropTypes.func.isRequired,
  selectedGenes: PropTypes.array.isRequired,
  plotUuid: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
  markerHeatmap: PropTypes.bool,
  config: PropTypes.object,
  onReset: PropTypes.func,
};
HeatmapControls.defaultProps = {
  markerHeatmap: false,
  onUpdate: () => { },
  config: {},
  onReset: () => { },
  cellSets: {},
};
export default HeatmapControls;
