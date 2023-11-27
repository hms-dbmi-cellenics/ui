import React, { useCallback } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Tooltip, Input } from 'antd';

const ProjectSearchBox = (props) => {
  const { onChange } = props;

  const debouncedSetFilterParam = useCallback(
    _.debounce((value) => {
      onChange(new RegExp(value, 'i'));
    }, 400),
    [],
  );

  return (

    <Tooltip title='To search, insert project name, project ID or analysis ID here' placement='right'>
      <Input
        placeholder='Filter by project name, project ID or analysis ID'
        onChange={(e) => debouncedSetFilterParam(e.target.value)}
      />
    </Tooltip>
  );
};

ProjectSearchBox.propTypes = {
  onChange: PropTypes.func.isRequired,
};

export default ProjectSearchBox;
