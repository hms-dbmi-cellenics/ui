import React from 'react';
import {
  Collapse, Select, Space, Button, Radio,
} from 'antd';
import PropTypes from 'prop-types';
import HeatmapGroupBySettings from '../../../data-exploration/heatmap/HeatmapGroupBySettings';
import HeatmapMetadataTracksSettings from '../../../data-exploration/heatmap/HeatmapMetadataTrackSettings';

const { Panel } = Collapse;

const HeatmapControls = (props) => {
  const {
    onGeneEnter, plotUuid, selectedGenes, markerHeatmap,
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
          {markerHeatmap && (
            <>
              <p>Select the number of top genes to show:</p>
              <Radio.Group>
                <Radio value={5}>5</Radio>
                <Radio value={10}>10</Radio>
                <Radio value={15}>15</Radio>
                <Radio value={20}>20</Radio>
                <Radio value={25}>25</Radio>
              </Radio.Group>
              {' '}
              <p>Select the gene label options:</p>
              <Radio.Group>
                <Radio value='show'>Show</Radio>
                <Radio value='hide'>Hide</Radio>
              </Radio.Group>
            </>
          )}
          <Button
            type='primary'
            onClick={() => onGeneEnter([])}
          >
            Reset
          </Button>
        </Space>
      </Panel>
      <Panel header='Metadata tracks' key='11'>
        <HeatmapMetadataTracksSettings componentType={plotUuid} />
      </Panel>
      <Panel header='Group by' key='12'>
        <HeatmapGroupBySettings componentType={plotUuid} />
      </Panel>
    </Collapse>

  );
};

HeatmapControls.propTypes = {
  onGeneEnter: PropTypes.func.isRequired,
  selectedGenes: PropTypes.array.isRequired,
  plotUuid: PropTypes.string.isRequired,
  markerHeatmap: PropTypes.bool,
};
HeatmapControls.defaultProps = {
  markerHeatmap: false,
};
export default HeatmapControls;
