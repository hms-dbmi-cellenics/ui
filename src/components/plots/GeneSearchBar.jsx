import React, { useState } from 'react';
import { AutoComplete, Button, Input } from 'antd';
import PropTypes from 'prop-types';

const filterGenes = (searchText, geneList, genesToDisable) => {
  const searchTextUpper = searchText.toUpperCase();
  const filteredList = geneList.filter((gene) => gene.toUpperCase().includes(searchTextUpper));
  const disableLoaded = filteredList.map((gene) => genesToDisable.includes(gene));

  // options needs to be an array of objects, set disabled for loaded genes
  return filteredList.map((geneName, index) => ({
    value: geneName, disabled: disableLoaded[index],
  }));
};

const GeneSearchBar = (props) => {
  const {
    geneList, genesToDisable, onSelect, allowMultiple, buttonText,
  } = props;

  const [options, setOptions] = useState([]);

  const [value, setValue] = useState('');

  const GENES_REGEX = /(?<!-)[,\s]+(?!-)/;
  const genes = value.split(GENES_REGEX);

  const onOptionSelect = (newGene) => {
    if (allowMultiple) {
      genes.splice(-1, 1, `${newGene}, `);
      setValue(genes.join(', '));
    } else {
      setValue(newGene);
    }
    setOptions([]);
  };

  const onSearch = (input) => {
    setValue(input);

    if (allowMultiple) {
      const inputGenes = input.split(GENES_REGEX);
      const searchText = inputGenes[inputGenes.length - 1];
      setOptions(!searchText ? [] : filterGenes(searchText, geneList, genesToDisable));
    } else {
      setOptions(!input ? [] : filterGenes(input, geneList, genesToDisable));
    }
    
  };

  const selectGenes = () => {
    if (value === '') return;

    if (allowMultiple) {
      const newGenes = genes.filter((gene) => geneList.includes(gene));
      onSelect(newGenes);
    } else if (geneList.includes(value)) {
      onSelect(value);
    }

    setValue('');
    setOptions([]);
  };

  return (
    <Input.Group compact>
      <AutoComplete
        allowClear
        style={{ width: '80%' }}
        value={value}
        options={options}
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
  geneList: PropTypes.array.isRequired,
  genesToDisable: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  buttonText: PropTypes.string,
  allowMultiple: PropTypes.bool,
};

GeneSearchBar.defaultProps = {
  buttonText: 'Add',
  allowMultiple: true,
};

export default GeneSearchBar;
