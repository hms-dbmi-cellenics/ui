import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Select,
  Form,
  Skeleton,
  Radio,
} from 'antd';

import { spatialPlotTypes, plotUuids } from 'utils/constants';

import { metadataKeyToName } from 'utils/data-management/metadataUtils';

import InlineError from 'components/InlineError';

const { Option, OptGroup } = Select;
const SelectData = (props) => {
  const {
    onUpdate, config, cellSets, disabled, plotType,
  } = props;

  const {
    hierarchy,
    properties,
  } = cellSets;

  const isSpatial = spatialPlotTypes.includes(plotType);

  const [showImage, setShowImage] = useState(true);

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
      <p><strong>Included Samples:</strong></p>
      <Form.Item>
        <Select
          value={config.selectedSample}
          disabled={disabled}
          onChange={(value) => {
            handleChange(value);
          }}
        >
          {!isSpatial && <Option value='All'>All</Option>}
          {parents.map((parent) => (
            <OptGroup label={metadataKeyToName(properties[parent.value].name)}>
              {getMetadataOptions(parent.value).map((option) => (
                <Option value={option.key}>{properties[option.key].name}</Option>
              ))}
            </OptGroup>
          ))}
        </Select>
      </Form.Item>
      {isSpatial && (
        <>
          <p><strong>Toggle Image:</strong></p>
          <Form.Item>
            <Radio.Group
              onChange={(e) => {
                setShowImage(e.target.value);
                onUpdate({ showImage: e.target.value });
              }}
              value={showImage}
            >
              <Radio value>Show</Radio>
              <Radio value={false}>Hide</Radio>
            </Radio.Group>
          </Form.Item>
        </>
      )}
    </>
  );
};
SelectData.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object,
  cellSets: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  plotType: PropTypes.string,
};

SelectData.defaultProps = {
  config: null,
  disabled: false,
  plotType: null,
};
export default SelectData;
