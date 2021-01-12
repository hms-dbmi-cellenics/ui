import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Select,
} from 'antd';

const SelectData = (props) => {
  const { onUpdate, config, cellSets } = props;

  // const getMetadataOptions = (parent) => {

  // };
  const getMetadataParents = () => {
    const options = cellSets.hierarchy.map(({ key }) => ({ value: key }));

    const filteredOptions = options.filter((element) => (
      cellSets.properties[element.value].type === 'metadataCategorical'
    ));
    return filteredOptions;
  };
  /*
  return (
    <>
      <div>
        Select the data to view on the embedding:
        {' '}
      </div>
      <Form.Item>
        <Select
          value={{ key: config.metadata }}
          onChange={(value) => changeMetadata(value)}
          labelInValue
          style={{ width: '100%' }}
          placeholder='Select cell set...'
          options={generateCellOptions('metadataCategorical')}
        />
      </Form.Item>
    </>
  ); */
};
SelectData.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  cellSets: PropTypes.object.isRequired,
};
export default SelectData;

/*
<select name='clients'>
  {this.props.clients && this.props.clients.length > 0 && this.props.clients.map((e, key) => (
    <optgroup key={key} label={e.name}>
      {e.projects.map((project, projectKey) => <option key={projectKey} value={project.id}>{project.name}</option>)}
    </optgroup>
  ))}
</select>;
*/
