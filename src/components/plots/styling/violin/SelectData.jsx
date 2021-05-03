import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
} from 'antd';

import composeTree from '../../../../utils/composeTree';

const { Option, OptGroup } = Select;
const SelectData = (props) => {
  const { onUpdate, config, cellSets } = props;
  const { hierarchy, properties } = cellSets;

  const handleChangeGrouping = (value) => {
    onUpdate({ selectedCellSet: value });
  };
  const handleChangePoints = (value) => {
    onUpdate({ selectedPoints: value });
  };

  const tree = composeTree(hierarchy, properties);

  const renderChildren = (rootKey, children) => {
    if (!children || children.length === 0) { return (<></>); }

    const shouldDisable = (key) => key.startsWith(`${config.selectedCellSet}/`);
    return children.map(({ key, name }) => {
      const uniqueKey = `${rootKey}/${key}`;
      return (
        <Option value={uniqueKey} key={uniqueKey} disabled={shouldDisable(uniqueKey)}>
          {name}
        </Option>
      );
    });
  };

  return (
    <>
      <div>
        Select the Cell sets or Metadata that cells are grouped by (determined the x-axis):
        {' '}
      </div>
      <Form.Item>
        <Select
          defaultValue={config.selectedCellSet}
          style={{ width: 200 }}
          onChange={(value) => {
            handleChangeGrouping(value);
          }}
        >
          {
            tree.map(({ key, name }) => (
              <Option key={key}>
                {name}
              </Option>
            ))
          }
        </Select>
      </Form.Item>
      <div>
        Select the Cell sets or Metadata to be shown as points:
        {' '}
      </div>
      <Form.Item>
        <Select
          defaultValue={config.selectedPoints}
          style={{ width: 200 }}
          onChange={(value) => {
            handleChangePoints(value);
          }}
        >
          <Option key='All'>All</Option>
          {
            tree.map(({ key, children }) => (
              <OptGroup label={properties[key]?.name} key={key}>
                {renderChildren(key, [...children])}
              </OptGroup>
            ))
          }
        </Select>
      </Form.Item>
    </>
  );
};
SelectData.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  cellSets: PropTypes.object.isRequired,
};
export default SelectData;
