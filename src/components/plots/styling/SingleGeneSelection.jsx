import React from 'react';
import PropTypes from 'prop-types';
import { Input, Skeleton } from 'antd';

const { Search } = Input;
const SingleGeneSelection = (props) => {
  const { config, setSearchedGene } = props;

  const changeDisplayedGene = (geneName) => {
    const geneNameNoSpaces = geneName.replace(/\s/g, '');
    setSearchedGene(geneNameNoSpaces);
  };
  console.log('CONFIG IS ', config);
  if (config) {
    return (
      <Search
        style={{ width: '100%' }}
        enterButton='Search'
        defaultValue={config.shownGene}
        onSearch={(val) => changeDisplayedGene(val)}
      />
    );
  }
  return (<Skeleton.Input style={{ width: 200 }} active />);
};
SingleGeneSelection.propTypes = {
  config: PropTypes.object.isRequired,
  setSearchedGene: PropTypes.func.isRequired,
};
export default SingleGeneSelection;
