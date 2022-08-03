import React, { useState } from 'react';
import { AutoComplete, Button, Input } from 'antd';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';

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
    const charArray = [...value];
    const lastComma = _.findLastIndex(charArray, (letter) => letter === ',');
    const newValue = charArray.slice(0, lastComma + 1).join('').concat(' ', newGene, ',').trim();
    setValue(newValue);
    setOptions([]);
  };

  const onSearch = (input) => {
    setValue(input);

    const charArray = [...input];
    const lastComma = _.findLastIndex(charArray, (letter) => letter === ',');
    const searchText = charArray.slice(lastComma + 1).join('').trim();

    setOptions(!searchText ? [] : filterGenes(searchText, geneList, config?.selectedGenes));
  };

  const onClick = () => {
    if (value === '') return;

    const newGenes = value.split(',').map((gene) => gene.trim()).filter((gene) => geneList.includes(gene));
    const genes = _.uniq([...config?.selectedGenes, ...newGenes]);

    if (_.isEqual(genes, config?.selectedGenes)) return;

    onSelect(genes);
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
        onClick={onClick}
        style={{ width: '20%' }}
      >
        Add
      </Button>
    </Input.Group>
  );
};

GeneSearchBar.propTypes = {
  plotUuid: PropTypes.string.isRequired,
  searchBarUuid: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default GeneSearchBar;
