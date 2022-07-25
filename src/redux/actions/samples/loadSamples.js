import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
  SAMPLES_LOADING,
} from 'redux/actionTypes/samples';

const toApiV1 = (samples, experimentId) => {
  const apiV1Samples = {};

  const buildApiv1Files = (files) => {
    const fileNames = [];
    const apiV1Files = {};

    Object.keys(files).forEach((key) => {
      const fileNameConvert = {
        features10x: 'features.tsv.gz',
        barcodes10x: 'barcodes.tsv.gz',
        matrix10x: 'matrix.mtx.gz',
      };
      const fileType = files[key]?.sampleFileType;
      if (!fileType) throw new Error('No sample file found');

      const fileName = fileNameConvert[fileType];

      fileNames.push(fileNameConvert[fileType]);

      apiV1Files[fileName] = {
        size: files[key].size,
        valid: true,
        name: fileName,
        upload: {
          status: files[key].uploadStatus,
        },
      };
    });

    return { apiV1Files, fileNames };
  };

  const sampleTechnologyConvert = (technology) => {
    if (technology === '10x') return '10X Chromium';

    throw new Error('Unknown sample technology');
  };

  samples.forEach((sample) => {
    const { apiV1Files, fileNames } = buildApiv1Files(sample.files);
    apiV1Samples[sample.id] = {
      experimentId,
      metadata: sample.metadata,
      createdDate: sample.createdAt,
      name: sample.name,
      lastModified: sample.updatedAt,
      files: apiV1Files,
      type: sampleTechnologyConvert(sample.sampleTechnology),
      fileNames,
      uuid: sample.id,
    };
  });

  return apiV1Samples;
};

const loadSamples = (experimentId) => async (dispatch) => {
  try {
    dispatch({
      type: SAMPLES_LOADING,
    });

    const url = `/v2/experiments/${experimentId}/samples`;
    const data = await fetchAPI(url);

    const samples = toApiV1(data, experimentId);

    dispatch({
      type: SAMPLES_LOADED,
      payload: {
        samples,
      },
    });
  } catch (e) {
    // TODO we were not raising notifications here, validate whether raising or not now is ok
    const errorMessage = handleError(e);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadSamples;
