import React, { useState } from 'react';
import { AutoComplete } from 'antd';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

const filterGenes = (searchText, geneList, loadedGenes) => {
  const searchTextUpper = searchText.toUpperCase();
  const filteredList = geneList.filter((gene) => gene.toUpperCase().includes(searchTextUpper));
  const disableLoaded = filteredList.map((gene) => loadedGenes.includes(gene));

  // options needs to be an array of objects, set disabled for loaded genes
  return filteredList.map((geneName, index) => ({
    value: geneName, disabled: disableLoaded[index],
  }));
};

const GeneSearchBar = (props) => {
  const {
    plotUuid, searchBarUuid, onSelect,
  } = props;

  const geneList = useSelector((state) => state.genes.properties.views[searchBarUuid]?.data);

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const [options, setOptions] = useState([]);

  // pass reactive component as value (search text) to allow auto clear on select
  const [value, setValue] = useState('');

  const onOptionSelect = (newGene) => {
    const genes = [...config?.selectedGenes, newGene];

    onSelect(genes);
    setValue('');
  };

  const onSearch = (searchText) => {
    setValue(searchText);
    setOptions(!searchText ? [] : filterGenes(searchText, geneList, config?.selectedGenes));
  };

  return (
    <AutoComplete
      allowClear
      value={value}
      options={options}
      style={{ width: '100%' }}
      onSelect={onOptionSelect}
      onSearch={onSearch}
      placeholder='Search for genes...'
    />
  );
};

GeneSearchBar.propTypes = {
  plotUuid: PropTypes.string.isRequired,
  searchBarUuid: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default GeneSearchBar;
