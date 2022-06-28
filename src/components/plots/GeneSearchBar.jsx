import React, { useState } from 'react';
import _ from 'lodash';
import { AutoComplete } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { loadGeneExpression } from 'redux/actions/genes';
import PropTypes from 'prop-types';

const filterGenes = (searchText, geneList, loadedGenes) => {
  const searchTextUpper = searchText.toUpperCase();
  const filteredList = geneList.filter((gene) => gene.toUpperCase().includes(searchTextUpper));
  const disableLoaded = filteredList.map((gene) => loadedGenes.includes(gene));

  // options needs to be an array of objects
  return filteredList.map((geneName, index) => ({ value: geneName, disabled: disableLoaded[index] }));
};

const GeneSearchBar = (props) => {
  const { plotUuid, experimentId, searchBarUuid } = props;

  const dispatch = useDispatch();

  const geneList = useSelector((state) => state.genes.properties.views[searchBarUuid]?.data);

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const [options, setOptions] = useState([]);

  // pass reactive component as value (search text) to allow auto clear on select
  const [value, setValue] = useState('');

  const onSelect = (newGene) => {
    if (!geneList.includes(newGene) || config?.selectedGenes.includes(newGene)) {
      return;
    }
    const genes = _.clone(config?.selectedGenes);
    genes.push(newGene);
    dispatch(loadGeneExpression(experimentId, genes, plotUuid));
    setValue('');
  };

  const onSearch = (searchText) => {
    setValue(searchText);
    setOptions(!searchText ? [] : filterGenes(searchText, geneList, config?.selectedGenes));
  };

  return (
    <AutoComplete
      id='SearchBox'
      allowClear
      value={value}
      options={options}
      style={{ width: '100%' }}
      onSelect={onSelect}
      onSearch={onSearch}
      placeholder='Search for genes...'
    />
  );
};

GeneSearchBar.propTypes = {
  plotUuid: PropTypes.string.isRequired,
  experimentId: PropTypes.string.isRequired,
  searchBarUuid: PropTypes.string.isRequired,
};

export default GeneSearchBar;
