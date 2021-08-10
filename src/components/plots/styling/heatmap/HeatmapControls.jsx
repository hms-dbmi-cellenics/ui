/* eslint-disable import/no-unresolved */
import React from 'react';
import {
  Collapse, Select, Space, Button, Radio,
} from 'antd';
import PropTypes from 'prop-types';
import getSelectOptions from 'utils/plots/getSelectOptions';
import HeatmapGroupBySettings from '../../../data-exploration/heatmap/HeatmapGroupBySettings';
import HeatmapMetadataTracksSettings from '../../../data-exploration/heatmap/HeatmapMetadataTrackSettings';

const { Panel } = Collapse;

const HeatmapControls = (props) => {
  const {
    onGeneEnter, plotUuid, selectedGenes, cellSets,
    markerHeatmap, onUpdate, config, onReset = () => onGeneEnter([]),
  } = props;
  const firstLetterUppercase = (word) => word?.charAt(0).toUpperCase() + word?.slice(1);

  const getCellOptions = (type) => {
    const { hierarchy, properties } = cellSets;
    const filteredOptions = hierarchy.filter((element) => (
      properties[element.key].type === type
    ));
    if (!filteredOptions.length) {
      return [];
    }
    return filteredOptions;
  };
  const changeClusters = (val) => {
    const newValue = val.key.toLowerCase();
    onUpdate({ selectedCellSet: newValue });
  };
  let clustersForSelect = {};
  if (markerHeatmap) {
    clustersForSelect = getSelectOptions(getCellOptions('cellSets'));
  }

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

              <p>Select the number of top genes per cluster to show:</p>
              <Radio.Group
                onChange={
                  (e) => onUpdate({ numGenes: e.target.value })
                }
                value={config.numGenes}
              >
                <Radio value={5}>5</Radio>
                <Radio value={10}>10</Radio>
                <Radio value={15}>15</Radio>
                <Radio value={20}>20</Radio>
                <Radio value={25}>25</Radio>
              </Radio.Group>
              {' '}
              <p>Gene labels:</p>
              <Radio.Group
                onChange={
                  (e) => onUpdate({ showGeneLabels: e.target.value })
                }
                value={config.showGeneLabels}
              >
                <Radio value>Show</Radio>
                <Radio value={false}>Hide</Radio>
              </Radio.Group>
            </>
          )}
          <Button
            type='primary'
            onClick={onReset}
          >
            Reset
          </Button>
        </Space>
      </Panel>
      {markerHeatmap && (
        <>
          <Panel header='Select Data' key='selectData'>
            <Select
              value={{
                key: firstLetterUppercase(config.selectedCellSet),
              }}
              onChange={changeClusters}
              labelInValue
              style={{ width: '100%' }}
              placeholder='Select cell set...'
              options={clustersForSelect}
            />
          </Panel>
          <Panel header='Cluster guardlines' key='clusterGuardlines'>
            <Radio.Group
              value={config.guardLines}
              onChange={(e) => onUpdate({ guardLines: e.target.value })}
            >
              <Radio value>Show</Radio>
              <Radio value={false}>Hide</Radio>
            </Radio.Group>
          </Panel>
        </>
      )}
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
  cellSets: PropTypes.object,
  onReset: PropTypes.func,
};
HeatmapControls.defaultProps = {
  markerHeatmap: false,
  onUpdate: () => {},
  config: {},
  onReset: () => {},
  cellSets: {},
};
export default HeatmapControls;
