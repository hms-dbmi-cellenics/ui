/* eslint-disable no-param-reassign */
import produce from 'immer';

import { calculateZScore } from 'utils/postRequestProcessing';
import initialState from 'redux/reducers/genes/initialState';
import { difference as _difference } from 'lodash';

const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

const genesExpressionLoaded = produce((draft, action) => {
  const { data, componentUuid, genes } = action.payload;

  let { loadingStatus } = action.payload;

  if (loadingStatus === undefined) {
    loadingStatus = _difference(upperCaseArray(draft.expression.loading), upperCaseArray(genes));
  }

  const dataWithZScore = calculateZScore(data);
  draft.expression.views[componentUuid] = { fetching: false, error: false, data: genes };

  draft.expression.data = { ...draft.expression.data, ...dataWithZScore };
  draft.expression.loading = loadingStatus;
}, initialState);

export default genesExpressionLoaded;
