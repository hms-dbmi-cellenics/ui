import samplesReducer from 'redux/reducers/samples';
import initialState, { sampleTemplate, sampleFileTemplate } from 'redux/reducers/samples/initialState';

import {
  SAMPLES_UPDATE,
  SAMPLES_FILE_UPDATE,
  SAMPLES_LOADED,
  SAMPLES_ERROR,
  SAMPLES_DELETE,
  SAMPLES_SAVING,
  SAMPLES_SAVED,
  SAMPLES_OPTIONS_UPDATE,
  SAMPLES_METADATA_DELETE,
  SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED,
  SAMPLES_CREATED,
  SAMPLES_VALIDATING_UPDATED,
} from 'redux/actionTypes/samples';
import { EXPERIMENTS_METADATA_RENAME } from 'redux/actionTypes/experiments';

describe('samplesReducer', () => {
  const mockUuid1 = 'asd123';
  const mockUuid2 = 'qwe234';
  const fileName = 'features.tsv';

  const sample1 = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: mockUuid1,
    createdDate: '2021-01-01T14:48:00.000Z',
    lastModified: '2021-01-01T14:48:00.000Z',
  };

  const sample2 = {
    ...sampleTemplate,
    name: 'test sample 2',
    uuid: mockUuid2,
    createdDate: '2021-01-02T14:48:00.000Z',
    lastModified: '2021-01-02T14:48:00.000Z',
  };

  const updateActionResult = {
    ...sample1,
    name: 'updated name',
  };

  const oneSampleState = {
    ...initialState,
    [sample1.uuid]: sample1,
  };

  const twoSamplesState = {
    ...oneSampleState,
    [sample2.uuid]: sample2,
  };

  const mockFile = {
    ...sampleFileTemplate,
    name: fileName,
  };

  it('Reduces identical state on unknown action', () => expect(
    samplesReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Inserts a new sample correctly', () => {
    const newState = samplesReducer(initialState, {
      type: SAMPLES_CREATED,
      payload: {
        samples: [sample1],
      },
    });

    expect(newState[sample1.uuid]).toEqual(sample1);
    expect(newState).toMatchSnapshot();
  });

  it('Adds a new sample correctly', () => {
    const newState = samplesReducer(oneSampleState, {
      type: SAMPLES_CREATED,
      payload: {
        samples: [sample2],
      },
    });

    expect(newState[sample1.uuid]).toEqual(sample1);
    expect(newState[sample2.uuid]).toEqual(sample2);
    expect(newState).toMatchSnapshot();
  });

  it('Updates a sample correctly', () => {
    const newState = samplesReducer(oneSampleState, {
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid: mockUuid1,
        sample: updateActionResult,
      },
    });

    expect(newState[sample1.uuid]).toEqual(updateActionResult);
    expect(newState).toMatchSnapshot();
  });

  it('Updates sample files correctly', () => {
    const newState = samplesReducer(oneSampleState, {
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid: mockUuid1,
        fileName,
        fileDiff: mockFile,
        lastModified: 'newLastModified',
      },
    });

    expect(newState[sample1.uuid].fileNames).toEqual([fileName]);
    expect(newState[sample1.uuid].files[fileName]).toEqual({
      ...mockFile,
      lastModified: 'newLastModified',
    });
    expect(newState).toMatchSnapshot();
  });

  it('Delete samples correctly', () => {
    const newState = samplesReducer(twoSamplesState, {
      type: SAMPLES_DELETE,
      payload: {
        sampleIds: [sample2.uuid],
      },
    });

    expect(newState[sample2.uuid]).toBeUndefined();
    expect(newState).toMatchSnapshot();
  });

  it('Loads samples correctly', () => {
    const newState = samplesReducer(initialState, {
      type: SAMPLES_LOADED,
      payload: {
        samples: {
          ids: [sample1.uuid, sample2.uuid],
          [sample1.uuid]: sample1,

          [sample2.uuid]: sample2,
        },
      },
    });

    expect(newState.meta.loading).toEqual(false);
    expect(newState.meta.error).toEqual(false);
    expect(newState).toMatchSnapshot();
  });

  it('Sets up saving state correctly', () => {
    const savingMsg = 'Saving';

    const newState = samplesReducer({
      ...oneSampleState,
      meta: {
        ...oneSampleState[sample1.uuid].meta,
        loading: false,
        saving: false,
        error: false,
      },
    }, {
      type: SAMPLES_SAVING,
      payload: { message: savingMsg },
    });

    expect(newState.meta.error).toBe(false);
    expect(newState.meta.loading).toBe(false);
    expect(newState.meta.saving).toBe(savingMsg);
    expect(newState).toMatchSnapshot();
  });

  it('Sets up saved state correctly', () => {
    const newState = samplesReducer({
      ...oneSampleState,
      meta: {
        ...oneSampleState[sample1.uuid].meta,
        loading: false,
        saving: true,
        error: false,
      },
    }, { type: SAMPLES_SAVED });

    expect(newState.meta.error).toBe(false);
    expect(newState.meta.loading).toBe(false);
    expect(newState.meta.saving).toBe(false);
    expect(newState).toMatchSnapshot();
  });

  it('Stores error state correctly', () => {
    const errMsg = 'Error message';

    const newState = samplesReducer({
      ...oneSampleState,
      meta: {
        ...oneSampleState[sample1.uuid].meta,
        loading: false,
        saving: true,
        error: true,
      },
    }, {
      type: SAMPLES_ERROR,
      payload: {
        error: errMsg,
      },
    });

    expect(newState.meta.error).not.toBe(false);
    expect(newState.meta.error).toBe(errMsg);
    expect(newState.meta.loading).toBe(false);
    expect(newState.meta.saving).toBe(false);
    expect(newState).toMatchSnapshot();
  });

  it('Inserts sample metadata correctly', () => {
    const metadataKey = 'metadata-test';
    const metadataValue = 'value';

    const sampleWithMetadata = {
      ...oneSampleState,
      [oneSampleState[mockUuid1]]: {
        metadata: {},
      },
    };

    const newState = samplesReducer(sampleWithMetadata, {
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid: mockUuid1,
        sample: { metadata: { [metadataKey]: metadataValue } },
      },
    });

    expect(newState[mockUuid1].metadata[metadataKey]).toEqual(metadataValue);
    expect(newState).toMatchSnapshot();
  });

  it('Deletes sample metadata correctly', () => {
    const metadataKey = 'metadata-test';
    const metadataValue = 'old-value';

    const sampleWithMetadata = {
      ...oneSampleState,
      [oneSampleState[mockUuid1]]: {
        metadata: {
          [metadataKey]: metadataValue,
        },
      },
    };

    const newState = samplesReducer(sampleWithMetadata, {
      type: SAMPLES_METADATA_DELETE,
      payload: {
        sampleUuid: mockUuid1,
        metadataKey,
      },
    });

    expect(newState[mockUuid1].metadata[metadataKey]).toBeUndefined();
    expect(newState).toMatchSnapshot();
  });

  it('Handles samplesValueInMetadataTrackUpdated correctly', () => {
    const metadataKey = 'metadata-test';
    const metadataOldValue = 'old-value';
    const metadataNewValue = 'new-value';

    const sampleWithMetadata = {
      ...oneSampleState,
      [mockUuid1]: {
        metadata: {
          [metadataKey]: metadataOldValue,
        },
      },
    };

    const newState = samplesReducer(sampleWithMetadata, {
      type: SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED,
      payload: {
        sampleUuid: mockUuid1,
        key: metadataKey,
        value: metadataNewValue,
      },
    });

    expect(newState).toMatchSnapshot();
  });

  it('Handles experimentMetadataRename correctly', () => {
    const experimentId = 'mockExpId';
    const oldMetadataKey = 'metadata-old';
    const newMetadataKey = 'metadata-new';
    const metadataValue = 'value';

    const stateWithMetadata = {
      ...oneSampleState,
      [mockUuid1]: {
        experimentId,
        metadata: {
          [oldMetadataKey]: metadataValue,
        },
      },
    };

    const newState = samplesReducer(stateWithMetadata, {
      type: EXPERIMENTS_METADATA_RENAME,
      payload: {
        oldKey: oldMetadataKey,
        newKey: newMetadataKey,
        experimentId,
      },
    });

    expect(newState[mockUuid1].metadata[newMetadataKey]).toEqual(metadataValue);
    expect(newState[mockUuid1].metadata[oldMetadataKey]).not.toBeDefined();
    expect(newState).toMatchSnapshot();
  });

  it('Updates options correctly', () => {
    const stateWithOldOptions = {
      ...twoSamplesState,
      [mockUuid1]: {
        ...sample1,
        options: { someOption: false },
      },
      [mockUuid2]: {
        ...sample2,
        options: { someOption: false },
      },
    };

    const newState = samplesReducer(stateWithOldOptions, {
      type: SAMPLES_OPTIONS_UPDATE,
      payload: {
        sampleUuids: [mockUuid1, mockUuid2],
        diff: { someOption: true },
      },
    });

    expect(newState).toMatchSnapshot();
  });

  it('Adds validating to an experiment', () => {
    const stateWithOldOptions = {
      ...twoSamplesState,
      [mockUuid1]: {
        ...sample1,
        options: { someOption: false },
      },
      [mockUuid2]: {
        ...sample2,
        options: { someOption: false },
      },
    };

    const newState = samplesReducer(stateWithOldOptions, {
      type: SAMPLES_VALIDATING_UPDATED,
      payload: {
        experimentId: 'validatingExperimentId',
        validating: true,
      },
    });

    expect(newState.meta.validating.includes('validatingExperimentId'));

    expect(newState).toMatchSnapshot();
  });

  it('Removes validating from an experiment', () => {
    const stateWithOldOptions = {
      ...twoSamplesState,
      [mockUuid1]: {
        ...sample1,
        options: { someOption: false },
      },
      [mockUuid2]: {
        ...sample2,
        options: { someOption: false },
      },
      meta: {
        validating: ['validatingExperimentId', 'otherValidatingExperimentId'],
      },
    };

    const newState = samplesReducer(stateWithOldOptions, {
      type: SAMPLES_VALIDATING_UPDATED,
      payload: {
        experimentId: 'validatingExperimentId',
        validating: false,
      },
    });

    expect(newState.meta.validating).toEqual(['otherValidatingExperimentId']);

    expect(newState).toMatchSnapshot();
  });
});
