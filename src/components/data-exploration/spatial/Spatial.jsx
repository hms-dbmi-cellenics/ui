// eslint-disable-file import/no-extraneous-dependencies
import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';

import dynamic from 'next/dynamic';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';

const VitessceSpatial = dynamic(
  () => import('../DynamicVitessceWrappers').then((mod) => mod.Spatial),
  { ssr: false },
);

const Spatial = (props) => {
  const {
    experimentId, height, width,
  } = props;

  const data = null;
  const showLoader = false;

  return (
    <>
      {showLoader && <center><Loader experimentId={experimentId} size='large' /></center>}
      <div
        className='vitessce-container vitessce-theme-light'
        style={{
          width,
          height,
          position: 'relative',
          display: showLoader ? 'none' : 'block',
        }}

      >
        {
          data ? (
            <VitessceSpatial />
          ) : ''
        }

      </div>
    </>
  );
};

Spatial.defaultProps = {};

Spatial.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
};
export default Spatial;
