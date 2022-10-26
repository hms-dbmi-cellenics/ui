import React, { useState } from 'react';
import { AutoComplete, Button, Input } from 'antd';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getGeneList } from 'redux/selectors';

const renderOptions = (searchText, geneList, genesToDisable) => {
  const searchTextUpper = searchText.toUpperCase();
  const filteredList = geneList.filter((gene) => gene.toUpperCase().includes(searchTextUpper));
  const disabledList = filteredList.map((gene) => genesToDisable.includes(gene));

  // options needs to be an array of objects, set disabled for genes that shouldn't be selectable
  return filteredList.map((geneName, index) => ({
    value: geneName, disabled: disabledList[index],
  }));
};

const GeneSearchBar = (props) => {
  const {
    genesToDisable, onSelect, allowMultiple, buttonText,
  } = props;

  const { data } = useSelector(getGeneList());
  const geneList = Object.keys(data);

  const [searchState, setSearchState] = useState({ value: '', options: [] });

  const GENES_REGEX = /(?<!-)[,\s]+(?!-)/;
  const genes = searchState.value.split(GENES_REGEX);

  const onOptionSelect = (newGene) => {
    let value;
    if (allowMultiple) {
      genes.splice(-1, 1, `${newGene}, `);
      value = genes.join(', ');
    } else {
      value = newGene;
    }
    setSearchState({ value, options: [] });
  };

  const onSearch = (input) => {
    let options;
    if (allowMultiple) {
      const inputGenes = input.split(GENES_REGEX);
      const searchText = inputGenes[inputGenes.length - 1];
      options = !searchText ? [] : renderOptions(searchText, geneList, genesToDisable);
    } else {
      options = !input ? [] : renderOptions(input, geneList, genesToDisable);
    }
    setSearchState({ value: input, options });
  };

  const selectGenes = () => {
    if (searchState.value === '') return;

    if (allowMultiple) {
      const newGenes = genes.filter((gene) => geneList.includes(gene));
      onSelect(newGenes);
    } else if (geneList.includes(searchState.value)) {
      onSelect(searchState.value);
    }

    setSearchState({ value: '', options: [] });
  };

  return (
    <Input.Group compact>
      <AutoComplete
        aria-label='SearchBar'
        allowClear
        style={{ width: '80%' }}
        value={searchState.value}
        options={searchState.options}
        onSelect={onOptionSelect}
        onSearch={onSearch}
        placeholder='Search for genes...'
      />
      <Button
        type='primary'
        onClick={selectGenes}
        style={{ width: '20%' }}
      >
        {buttonText}
      </Button>
    </Input.Group>
  );
};

GeneSearchBar.propTypes = {
  genesToDisable: PropTypes.array,
  onSelect: PropTypes.func.isRequired,
  buttonText: PropTypes.string,
  allowMultiple: PropTypes.bool,
};

GeneSearchBar.defaultProps = {
  genesToDisable: [],
  buttonText: 'Add',
  allowMultiple: true,
};

export default GeneSearchBar;
