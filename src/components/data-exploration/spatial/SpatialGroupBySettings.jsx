import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Switch, Space } from 'antd';
import { ClipLoader } from 'react-spinners';

import { updatePlotConfig } from 'redux/actions/componentConfig';
import { getCellSets, getCellSetsHierarchyByType, getGroupSlidesBy } from 'redux/selectors';
import colors from 'utils/styling/colors';

// Mutually-exclusive grouping picker, styled like the visible-layers toggles in
// the same settings dropdown: one <Switch> "Name" row per available sample-level
// metadata option, in a single column. "Samples" (the 'sample' class) is the
// default flat view — samples in Cell sets & metadata tile order, ungrouped.
// Picking a metadata track instead lays samples out one group per row.
const SAMPLES_KEY = 'sample';

const SpatialGroupBySettings = (props) => {
  const dispatch = useDispatch();
  const { componentType } = props;

  const { accessible: cellSetsAccessible } = useSelector(getCellSets());
  // include 'sample' ("Samples") — it's the default flat/ungrouped option
  const tracks = useSelector(getCellSetsHierarchyByType('metadataCategorical'));
  const groupSlidesBy = useSelector(getGroupSlidesBy(componentType));

  // The active option: the stored selection if still available, else "Samples"
  // (the default). Keep this in sync with SpatialViewer.
  const selectedKey = useMemo(() => {
    const available = tracks.map(({ key }) => key);
    return groupSlidesBy.find((key) => available.includes(key)) ?? SAMPLES_KEY;
  }, [groupSlidesBy, tracks]);

  const setGroupSlidesBy = (key) => {
    dispatch(updatePlotConfig(componentType, { groupSlidesBy: [key] }));
  };

  if (!cellSetsAccessible) {
    return <center><ClipLoader size={20} color={colors.darkRed} /></center>;
  }

  if (!tracks.length) {
    return <div style={{ padding: '5px' }}>No sample metadata to group by.</div>;
  }

  const stopPropagationEvent = (e) => e.stopPropagation();

  return (
    <div style={{ padding: '5px' }}>
      <Space direction='vertical'>
        {tracks.map(({ key, name }) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <div key={key} onClick={stopPropagationEvent}>
            <Switch
              checked={key === selectedKey}
              // mutually exclusive: turning one on selects it (others turn off);
              // ignore turning the active one off so there's always a selection
              onChange={(checked) => checked && setGroupSlidesBy(key)}
            />
            <span style={{ marginLeft: 10 }}>{name}</span>
          </div>
        ))}
      </Space>
    </div>
  );
};

SpatialGroupBySettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default SpatialGroupBySettings;
