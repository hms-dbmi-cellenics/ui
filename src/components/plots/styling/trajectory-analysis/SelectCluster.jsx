import React from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Space,
} from 'antd';

const { Option, OptGroup } = Select;
const SelectCluster = (props) => {
  const { onUpdate, config, cellSets } = props;
  const { hierarchy, properties } = cellSets;

  const getMetadataOptions = (parent) => {
    const children = hierarchy.filter((cluster) => (
      cluster.key === parent))[0]?.children;
    return children;
  };

  const getMetadataParents = () => {
    const options = hierarchy.map(({ key }) => ({ value: key }));

    const filteredOptions = options.filter((element) => (
      properties[element.value].type === 'cellSets'
    ));
    return filteredOptions;
  };
  const handleChange = (value) => {
    onUpdate({ rootNode: value });
  };

  const parents = getMetadataParents();

  return (
    <>
      <Space size='small' direction='vertical'>
        <span>
          Select the cellset to use as root node
        </span>
        <Select
          defaultValue={config.rootNode || `${parents[0].value}/${parents[0].value}-0`}
          style={{ width: 200 }}
          onChange={(value) => {
            handleChange(value);
          }}
        >
          {parents.map((parent) => (
            <OptGroup key={parent.value} label={properties[parent.value].name}>
              {getMetadataOptions(parent.value).map((option) => (
                <Option key={option.key} value={`${parent.value}/${option.key}`}>{properties[option.key].name}</Option>
              ))}
            </OptGroup>
          ))}
        </Select>
      </Space>
    </>
  );
};
SelectCluster.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  cellSets: PropTypes.object.isRequired,
};
export default SelectCluster;
