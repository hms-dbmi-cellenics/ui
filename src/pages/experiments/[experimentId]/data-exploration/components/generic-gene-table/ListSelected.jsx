import React, { useState, useEffect } from 'react';
import {
  Button, Select,
} from 'antd';
import { useSelector } from 'react-redux';

const ListSelected = () => {
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [listed, setListed] = useState(false);
  console.log(selectedGenes, listed);
  if (listed && !selectedGenes.length) setListed(false);
  if (listed) {
    return (
      <>
        <Button type='link' size='small'
          onClick={() => { setListed(false) }}
        >Hide selected</Button>
        <Select
          value={selectedGenes}
          mode='multiple'
          showArrow={false}
          style={{ width: '100%' }}
        />
      </>
    );
  }
  return (
    <Button type='link' size='small'
      onClick={() => { setListed(true) }}
    >List selected</Button>
  )
}

export default ListSelected;
