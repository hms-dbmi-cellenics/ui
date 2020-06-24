
import React from 'react';
import { Tooltip } from 'antd';
import { EyeTwoTone } from '@ant-design/icons';
import styles from './GeneLookupButton.module.css';

const GeneLookupButton = () => (
  <div className={styles.container}>
    <div className={styles.icon}>
      <Tooltip placement='right' title='Show gene expression'>
        <EyeTwoTone style={{ cursor: 'pointer' }} />
      </Tooltip>
    </div>
  </div>
);

export default GeneLookupButton;
