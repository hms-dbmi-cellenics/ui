import React from 'react';
import PropTypes from 'prop-types';
import { Collapse, Input, Skeleton } from 'antd';

const { Panel } = Collapse;
const { Search } = Input;
const SingleGeneSelection = (props) => {
  const { config, onUpdate } = props;
  if (config) {
    return (
      <Search
        style={{ width: '100%' }}
        enterButton='Search'
        defaultValue={config.shownGene}
        onSearch={(val) => onUpdate(val)}
      />
    );
  }
  return (<Skeleton.Input style={{ width: 200 }} active />);
};
SingleGeneSelection.propTypes = {
  config: PropTypes.object.isRequired,
  changeDisplayedGene: PropTypes.func.isRequired,
};
export default SingleGeneSelection;
