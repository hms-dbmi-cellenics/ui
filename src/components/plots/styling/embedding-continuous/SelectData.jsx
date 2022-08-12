import React from 'react';
import PropTypes from 'prop-types';

import {
  Select,
  Form,
  Skeleton,
} from 'antd';

import { metadataKeyToName } from 'utils/data-management/metadataUtils';

import InlineError from 'components/InlineError';

const { Option, OptGroup } = Select;
const SelectData = (props) => {
  const { onUpdate, config, cellSets } = props;

  const {
    hierarchy,
    properties,
  } = cellSets;

  const getMetadataOptions = (parent) => {
    const children = hierarchy.filter((cluster) => (
      cluster.key === parent))[0]?.children;
    return children;
  };
  const getMetadataParents = () => {
    const options = hierarchy.map(({ key }) => ({ value: key }));

    const filteredOptions = options.filter((element) => (
      properties[element.value].type === 'metadataCategorical'
    ));
    return filteredOptions;
  };
  const handleChange = (value) => {
    onUpdate({ selectedSample: value });
  };
  const parents = getMetadataParents();

  if (cellSets.error) {
    return <InlineError message='Error loading cell set' />;
  }

  if (!config || !cellSets.accessible) {
    return <Skeleton.Input style={{ width: 200 }} active />;
  }

  return (
    <>
      <div>
        Select the data to view on the embedding:
      </div>
      <Form.Item>
        <Select
          value={config.selectedSample}
          style={{ width: 200 }}
          onChange={(value) => {
            handleChange(value);
          }}
        >
          <Option value='All'>All</Option>
          {parents.map((parent) => (
            <OptGroup label={metadataKeyToName(properties[parent.value].name)}>
              {getMetadataOptions(parent.value).map((option) => (
                <Option value={option.key}>{properties[option.key].name}</Option>
              ))}
            </OptGroup>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};
SelectData.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object,
  cellSets: PropTypes.object.isRequired,
};

SelectData.defaultProps = {
  config: null,
};
export default SelectData;
