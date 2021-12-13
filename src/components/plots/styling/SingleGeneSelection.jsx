import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Input, Skeleton } from 'antd';

const { Search } = Input;
const SingleGeneSelection = (props) => {
  const { config, setSearchedGene } = props;

  const changeDisplayedGene = (geneName) => {
    const geneNameNoSpaces = geneName.replace(/\s/g, '');
    setSearchedGene(geneNameNoSpaces);
  };

  const [localShownGene, setLocalShownGene] = useState(config?.shownGene);

  if (!config) {
    return <Skeleton.Input style={{ width: 200 }} active />;
  }

  return (
    <Search
      style={{ width: '100%' }}
      enterButton='Search'
      value={localShownGene}
      onChange={(e) => { setLocalShownGene(e.target.value); }}
      onSearch={(val) => changeDisplayedGene(val)}
    />
  );
};
SingleGeneSelection.propTypes = {
  config: PropTypes.object,
  setSearchedGene: PropTypes.func.isRequired,
};

SingleGeneSelection.defaultProps = {
  config: null,
};
export default SingleGeneSelection;
