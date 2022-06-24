import React, { useState } from 'react';
import _ from 'lodash';
import { AutoComplete } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { loadGeneExpression } from 'redux/actions/genes';
import PropTypes from 'prop-types';

// import ListAllGenes from 'components/plots/gene-search-bar/ListAllGenes.jsx';

const filterGenes = (searchText, geneList) => {
  // searchText is a string, geneList is an array of gene names
  // setOptions needs an array of objects with key: value -> value: geneName
  const searchTextUpper = searchText.toUpperCase();
  const filteredList = geneList.filter((gene) => gene.toUpperCase().includes(searchTextUpper));

  return filteredList.map((geneName) => ({ value: geneName }));
};

const GeneSearchBar = (props) => {
  const { plotUuid, experimentId } = props;

  const componentUuid = 'SearchBar';

  const dispatch = useDispatch();

  const geneList = useSelector((state) => state.genes.properties.views[componentUuid]?.data);

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const [options, setOptions] = useState([]);

  const onSelect = (newGene) => {
    if (!geneList.includes(newGene) || config?.selectedGenes.includes(newGene)) {
      return;
    }
    const genes = _.clone(config?.selectedGenes);
    genes.push(newGene);
    dispatch(loadGeneExpression(experimentId, genes, plotUuid));
  };

  const onSearch = (searchText) => {
    setOptions(!searchText ? [] : filterGenes(searchText, geneList));
  };

  return (
    <AutoComplete
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
};

export default GeneSearchBar;
