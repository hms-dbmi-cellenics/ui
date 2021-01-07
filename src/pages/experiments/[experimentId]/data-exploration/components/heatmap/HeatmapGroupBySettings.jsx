import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Radio } from 'antd';
import { updatePlotConfig } from '../../../../../../redux/actions/componentConfig';

const HeatmapGroupBySettings = () => {
  const dispatch = useDispatch();
  const groupedTrack = useSelector((state) => state.plots.interactiveHeatmap.config.groupedTrack);

  const cellSets = useSelector((state) => state.cellSets);

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  const getCellSets = (category) => {
    if (!cellSets || cellSets.loading) {
      return [];
    }

    return cellSets.hierarchy.map(
      ({ key }) => (
        { key, name: cellSets.properties[key].name, type: cellSets.properties[key].type }
      ),
    ).filter(
      ({ type }) => category.includes(type),
    );
  };

  return (
    <div style={{ padding: '5px' }}>
      <Radio.Group
        value={groupedTrack}
        onChange={({ target }) => dispatch(
          updatePlotConfig('interactiveHeatmap', {
            groupedTrack: target.value,
          }),
        )}
      >
        {getCellSets(
          ['cellSets', 'metadataCategorical'],
        ).map((cellSet) => (
          <Radio style={radioStyle} value={cellSet.key}>
            {cellSet.name}
          </Radio>
        ))}
      </Radio.Group>
    </div>
  );
};

HeatmapGroupBySettings.defaultProps = {
};

HeatmapGroupBySettings.propTypes = {
};

export default HeatmapGroupBySettings;
