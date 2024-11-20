import _ from 'lodash';

import { sampleTech } from 'utils/constants';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';
import sampleFileType from 'utils/sampleFileType';
import { fileObjectToFileRecord } from 'utils/upload/processSampleUpload';

const techNamesToDisplay = {
  [sampleTech['10X']]: '10X Chromium',
  [sampleTech.RHAPSODY]: 'BD Rhapsody',
  [sampleTech.SEURAT_OBJECT]: 'Seurat',
  [sampleTech.SEURAT_SPATIAL_OBJECT]: 'Seurat - Spatial',
  [sampleTech.SCE_OBJECT]: 'SingleCellExperiment',
  [sampleTech.ANNDATA_OBJECT]: 'AnnData',
  [sampleTech.H5]: '10X Chromium - H5',
  [sampleTech.PARSE]: 'Parse Evercode WT',
};

const techCategoryNames = {
  SINGLE_CELL_COUNT_MATRIX: 'SINGLE CELL - Sample Count Matrices',
  SINGLE_CELL_PREPROCESSED: 'SINGLE CELL - Preprocessed Object',
  SPATIAL_PREPROCESSED: 'SPATIAL - Preprocessed Object',
};

const matchFileName = (fileName, fileNames) => {
  const regexString = `.*(${Array.from(fileNames).join('|')})$`;
  const regexp = new RegExp(regexString, 'i');
  return regexp.test(fileName);
};

const filterFilesDefaultConstructor = (selectedTech) => async (files) => {
  let filteredFiles = files;

  let filesNotInFolder = false;

  filteredFiles = filteredFiles
    // Remove all files that aren't in a folder
    .filter((fileObject) => {
      const inFolder = fileObject.path.includes('/');

      filesNotInFolder ||= !inFolder;

      return inFolder;
    })
    // Remove all files that don't fit the current technology's valid names
    .filter((file) => fileUploadUtils[selectedTech].isNameValid(file.name));

  if (filesNotInFolder) {
    handleError('error', endUserMessages.ERROR_FILES_FOLDER);
  }

  const invalidFiles = _.difference(files, filteredFiles)
    .map((file) => ({ path: file.path, rejectReason: 'Invalid file path. Check the instructions in the modal for more information' }));

  return {
    valid: await Promise.all(filteredFiles.map((file) => (
      fileObjectToFileRecord(file, selectedTech)
    ))),
    invalid: invalidFiles,
  };
};

const getFilePathToDisplayDefaultConstructor = (selectedTech) => (filePath) => (
  _.trim(Object.values(fileUploadUtils[selectedTech].getFileSampleAndName(filePath)).join('/'), '/')
);

const getFileSampleAndNameDefault = (filePath) => {
  const [sample, name] = _.takeRight(filePath.split('/'), 2);

  return { sample, name };
};

/* eslint-disable max-len */
const fileUploadUtils = {
  [sampleTech['10X']]: {
    category: techCategoryNames.SINGLE_CELL_COUNT_MATRIX,
    acceptedFiles: new Set([
      'barcodes.tsv',
      'barcodes.tsv.gz',
      'features.tsv',
      'features.tsv.gz',
      'genes.tsv',
      'genes.tsv.gz',
      'matrix.mtx',
      'matrix.mtx.gz',
    ]),
    inputInfo: [
      ['<code>features.tsv</code> or <code>features.tsv.gz</code> or <code>genes.tsv</code> or <code>genes.tsv.gz</code>'],
      ['<code>barcodes.tsv</code> or <code>barcodes.tsv.gz</code>'],
      ['<code>matrix.mtx</code> or <code>matrix.mtx.gz</code>'],
    ],
    requiredFiles: [sampleFileType.BARCODES_10_X, sampleFileType.FEATURES_10_X, sampleFileType.MATRIX_10_X],
    fileUploadParagraphs: [
      'For each sample, upload a folder containing the 3 required files. The folder\'s name will be used to name the sample in it. You can change this name later in Data Management.',
      'The required files for each sample are:',
    ],
    dropzoneText: 'Drag and drop folders here or click to browse.',
    // setting to empty string allows folder upload on dropzone click
    webkitdirectory: '',
    isNameValid(fileName) { return matchFileName(fileName, this.acceptedFiles); },
    getCorrespondingType(fileName) {
      const fileNameToType = {
        'barcodes.tsv.gz': sampleFileType.BARCODES_10_X,
        'barcodes.tsv': sampleFileType.BARCODES_10_X,
        'features.tsv.gz': sampleFileType.FEATURES_10_X,
        'genes.tsv.gz': sampleFileType.FEATURES_10_X,
        'features.tsv': sampleFileType.FEATURES_10_X,
        'genes.tsv': sampleFileType.FEATURES_10_X,
        'matrix.mtx.gz': sampleFileType.MATRIX_10_X,
        'matrix.mtx': sampleFileType.MATRIX_10_X,
      };

      const allowedNames = Array.from(this.acceptedFiles);

      const name = allowedNames.find((allowedName) => fileName.endsWith(allowedName));

      return fileNameToType[name];
    },
    filterFiles: filterFilesDefaultConstructor(sampleTech['10X']),
    getFileSampleAndName: getFileSampleAndNameDefault,
    getFilePathToDisplay: getFilePathToDisplayDefaultConstructor(sampleTech['10X']),
  },
  [sampleTech.H5]: {
    category: techCategoryNames.SINGLE_CELL_COUNT_MATRIX,
    acceptedFiles: new Set(['matrix.h5', 'matrix.h5.gz']),
    inputInfo: [['<code>matrix.h5</code> or <code>matrix.h5.gz</code>']],
    requiredFiles: ['10x_h5'],
    fileUploadParagraphs: [`For each sample, upload a folder containing the h5 file. The folder's
    name will be used to name the sample in it.
    You can change this name later in Data Management.`],
    isNameValid: (fileName) => fileName.toLowerCase().match(/.*matrix.h5(.gz)?$/),
    getCorrespondingType: () => '10x_h5',
    filterFiles: filterFilesDefaultConstructor(sampleTech.H5),
    getFilePathToDisplay: getFilePathToDisplayDefaultConstructor(sampleTech.H5),
    getFileSampleAndName: getFileSampleAndNameDefault,
  },
  [sampleTech.RHAPSODY]: {
    category: techCategoryNames.SINGLE_CELL_COUNT_MATRIX,
    acceptedFiles: new Set(['expression_data.st', 'expression_data.st.gz']),
    requiredFiles: ['rhapsody'],
    inputInfo: [
      ['<code>expression_data.st</code> or <code>expression_data.st.gz</code>'],
    ],
    fileUploadParagraphs: [
      `For each sample, upload a folder containing the required file. The folder's
      name will be used to name the sample in it.
      You can change this name later in Data Management.`,
    ],
    dropzoneText: 'Drag and drop folders here or click to browse.',
    webkitdirectory: '',
    isNameValid: (fileName) => fileName.toLowerCase().match(/.*expression_data.st(.gz)?$/),
    getCorrespondingType: () => 'rhapsody',
    filterFiles: filterFilesDefaultConstructor(sampleTech.RHAPSODY),
    getFilePathToDisplay: getFilePathToDisplayDefaultConstructor(sampleTech.RHAPSODY),
    getFileSampleAndName: getFileSampleAndNameDefault,
  },
  [sampleTech.PARSE]: {
    category: techCategoryNames.SINGLE_CELL_COUNT_MATRIX,
    acceptedFiles: new Set([
      'all_genes.csv',
      'all_genes.csv.gz',
      'cell_metadata.csv',
      'cell_metadata.csv.gz',
      'DGE.mtx',
      'DGE.mtx.gz',
      'count_matrix.mtx',
      'count_matrix.mtx.gz',
    ]),
    inputInfo: [
      ['<code>all_genes.csv</code> or <code>all_genes.csv.gz</code>'],
      ['<code>cell_metadata.csv</code> or <code>cell_metadata.csv.gz</code>'],
      ['<code>count_matrix.mtx</code>, <code>count_matrix.mtx.gz</code>, <code>DGE.mtx</code> or <code>DGE.mtx.gz</code>'],
    ],
    requiredFiles: ['matrixParse', 'barcodesParse', 'featuresParse'],
    fileUploadParagraphs: [
      'Directly upload the single folder output by the Parse\'s pipeline.',
      'For each sample, the files contained in either the "DGE_unfiltered" or "DGE_filtered" folders will be used. The containing folder\'s name will be used to name the sample in it. You can change this name later in Data Management.',
      'Note that files inside the folder "all-samples" ("all-well" in previous versions) are not supported currently and will be ignored.',
      'The expected files in at least one of the DGE folders are:',
    ],
    dropzoneText: 'Drag and drop folders here or click to browse.',
    // setting to empty string allows folder upload on dropzone click
    webkitdirectory: '',
    isNameValid(fileName) { return matchFileName(fileName, this.acceptedFiles); },
    getCorrespondingType(fileName) {
      const fileNameToType = {
        'all_genes.csv.gz': sampleFileType.FEATURES_PARSE,
        'all_genes.csv': sampleFileType.FEATURES_PARSE,
        'cell_metadata.csv.gz': sampleFileType.BARCODES_PARSE,
        'cell_metadata.csv': sampleFileType.BARCODES_PARSE,
        'DGE.mtx.gz': sampleFileType.MATRIX_PARSE,
        'DGE.mtx': sampleFileType.MATRIX_PARSE,
        'count_matrix.mtx': sampleFileType.MATRIX_PARSE,
        'count_matrix.mtx.gz': sampleFileType.MATRIX_PARSE,
      };

      return fileNameToType[fileName];
    },
    filterFiles: async (files) => {
      const sampleNameMatcher = '([^/]+)';

      const parseUtils = fileUploadUtils[sampleTech.PARSE];

      // Gets a dirNameDGE and a list to filter over
      // Returns the same list of files
      //  The valid ones are in a dictionary ordered by their sample names
      //  The invalid ones are in a list
      const getFilesMatching = (middlePath, filesToFilter) => {
        const validFiles = {};
        const invalidFiles = [];

        const regexes = Array.from(parseUtils.acceptedFiles).map((validFileName) => (
          new RegExp(`${sampleNameMatcher}/${middlePath}${validFileName}$`)
        ));

        filesToFilter.forEach((fileObject) => {
          let sampleName;

          // Check if any of the valid paths match
          // If one does, extract the sampleName from it
          const isValid = regexes.some((regex) => {
            const result = regex.exec(fileObject.path);
            sampleName = result?.[1];

            return result;
          });

          if (isValid) {
            validFiles[sampleName] = [...(validFiles[sampleName] ?? []), fileObject];
          } else {
            invalidFiles.push(fileObject);
          }
        });

        return { valid: validFiles, invalid: invalidFiles };
      };

      const dgeUnfilteredFiles = getFilesMatching('DGE_unfiltered/', files);
      const dgeFilteredFiles = getFilesMatching('DGE_filtered/', dgeUnfilteredFiles.invalid);
      const noMiddlePathFiles = getFilesMatching('', dgeFilteredFiles.invalid);

      // These are the ones that didn't match any of the 3 accepted shapes
      const invalidFiles = noMiddlePathFiles.invalid.map((file) => ({
        path: file.path,
        rejectReason: 'Invalid file path. It should be in the form "sample/DGE_unfiltered/file", "sample/DGE_filtered/file" or "sample/file".',
      }));

      const filesToUpload = _.uniq([
        ...Object.entries(dgeFilteredFiles.valid),
        ...Object.entries(dgeUnfilteredFiles.valid),
        ...Object.entries(noMiddlePathFiles.valid)])
        // Only allow sample-specific files, not all samples in one files
        .filter(([sampleName, sampleFiles]) => {
          const accepted = !['all-sample', 'all-well', 'All Wells'].includes(sampleName);

          if (!accepted) {
            invalidFiles.push(
              ...sampleFiles.map((file) => ({
                path: file.path,
                rejectReason: 'Uploading files in "all-sample", "all-well" and "All Wells" is not supported currently.',
              })),
            );
          }

          return accepted;
        })
        .flatMap(([sampleName]) => (
          // By order of priority
          dgeUnfilteredFiles.valid[sampleName] ?? dgeFilteredFiles.valid[sampleName] ?? noMiddlePathFiles.valid[sampleName]
        ));

      return {
        valid: await Promise.all(filesToUpload.map((file) => (
          fileObjectToFileRecord(file, sampleTech.PARSE)
        ))),
        invalid: invalidFiles,
      };
    },
    getFilePathToDisplay: (filePath) => {
      const { sample, filteredState, name } = fileUploadUtils[sampleTech.PARSE].getFileSampleAndName(filePath);

      if (filteredState) {
        return [sample, filteredState, name].join('/');
      }

      return [sample, name].join('/');
    },
    getFileSampleAndName: (filePath) => {
      const splitFilePath = _.takeRight(_.trim(filePath, '/').split('/'), 3);

      let sample;
      let filteredState;
      let name;

      // Path can take one of two accepted shapes:
      // - sample/<DGE_unfiltered or DGE_filtered>/file
      // - sample/file
      if (['DGE_unfiltered', 'DGE_filtered'].includes(splitFilePath[1])) {
        [sample, filteredState, name] = splitFilePath;
      } else {
        // splitFilePath might be length 2 or 3, so use takeRight
        [sample, name] = _.takeRight(splitFilePath, 2);
      }

      return { sample, filteredState, name };
    },
  },
  [sampleTech.SEURAT_OBJECT]: {
    category: techCategoryNames.SINGLE_CELL_PREPROCESSED,
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['<code>scdata$samples</code>: sample assignment. If absent, treated as unisample.'],
      ['<code>scdata[[\'RNA\']]@counts</code>: raw feature counts.'],
      ['<code>DefaultDimReduc(scdata)</code>: is either <code>umap</code>, <code>tsne</code>, or a close match (e.g. <code>ref.umap</code>).'],
      ['\uD83D\uDCA1cluster metadata in <code>scdata@meta.data</code> is auto-detected.'],
      ['\uD83D\uDCA1sample level metadata in <code>scdata@meta.data</code> that groups samples in <code>scdata$samples</code> is auto-detected for downstream analysis.'],
      ['\uD83D\uDCA1if file size is over 15GB, try removing any assays not indicated above.'],
    ],
    requiredFiles: [sampleFileType.SEURAT_OBJECT],
    fileUploadParagraphs: [
      '<p>For your dataset, upload a single <code>*.rds</code> file with the Seurat object (max 15GB).</p>',
      '<p>The Seurat object must contain the following slots and metadata:</p>',
    ],
    dropzoneText: 'Drag and drop *.rds file here or click to browse.',
    // setting to null allows file upload on dropzone click
    webkitdirectory: null,
    isNameValid(fileName) {
      return this.validExtensionTypes.some(
        (validExtension) => fileName.endsWith(validExtension),
      );
    },
    getCorrespondingType: () => sampleFileType.SEURAT_OBJECT,
    // For more information on this one check the TODO1 at FileUploadModal
    filterFiles: () => { throw new Error('Not Implemented'); },
    getFilePathToDisplay: getFilePathToDisplayDefaultConstructor(sampleTech.SEURAT_OBJECT),
    getFileSampleAndName: getFileSampleAndNameDefault,
  },
  [sampleTech.SCE_OBJECT]: {
    category: techCategoryNames.SINGLE_CELL_PREPROCESSED,
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['<code>sce$samples</code>: sample assignment. If absent, treated as unisample.'],
      ['<code>counts(sce)</code>: raw feature counts.'],
      ['<code>reducedDimNames(sce)</code>: includes either <code>UMAP</code>, <code>TSNE</code>, or a close match (e.g. <code>REF.UMAP</code>).'],
      ['\uD83D\uDCA1cluster metadata in <code>sce@colData</code> is auto-detected.'],
      ['\uD83D\uDCA1sample level metadata in <code>sce@colData</code> that groups samples in <code>sce$samples</code> is auto-detected for downstream analysis.'],
      ['\uD83D\uDCA1if file size is over 15GB, try removing any slots not indicated above.'],
    ],
    requiredFiles: [sampleFileType.SCE_OBJECT],
    fileUploadParagraphs: [
      '<p>For your dataset, upload a single <code>*.rds</code> file with the SingleCellExperiment object (max 15GB).</p>',
      '<p>The SingleCellExperiment object must contain the following slots and metadata:</p>',
    ],
    dropzoneText: 'Drag and drop *.rds file here or click to browse.',
    // setting to null allows file upload on dropzone click
    webkitdirectory: null,
    isNameValid(fileName) {
      return this.validExtensionTypes.some(
        (validExtension) => fileName.endsWith(validExtension),
      );
    },
    getCorrespondingType: () => sampleFileType.SCE_OBJECT,
    // For more information on this one check the TODO1 at FileUploadModal
    filterFiles: () => { throw new Error('Not Implemented'); },
    getFilePathToDisplay: getFilePathToDisplayDefaultConstructor(sampleTech.SCE_OBJECT),
    getFileSampleAndName: getFileSampleAndNameDefault,
  },
  [sampleTech.ANNDATA_OBJECT]: {
    category: techCategoryNames.SINGLE_CELL_PREPROCESSED,
    validExtensionTypes: ['.h5ad'],
    inputInfo: [
      ["<code>adata.obs['samples']</code>: sample assignment. If absent, treated as unisample."],
      ['<code>adata.raw.X</code> or <code>adata.X</code>: raw feature counts. If both are present, <code>adata.raw.X</code> should be raw counts.'],
      ["<code>adata.obsm</code>: includes either a <code>'X_umap'</code> or <code>'X_tsne'</code> reduction."],
      ['\uD83D\uDCA1cluster metadata in <code>adata.obs</code> is auto-detected.'],
      ["\uD83D\uDCA1sample level metadata in <code>adata.obs</code> that groups samples in <code>adata.obs['samples']</code> is auto-detected for downstream analysis."],
      ['\uD83D\uDCA1if file size is over 15GB, try removing any slots not indicated above.'],
    ],
    requiredFiles: [sampleFileType.ANNDATA_OBJECT],
    fileUploadParagraphs: [
      '<p>For your dataset, upload a single <code>*.h5ad</code> file with the AnnData object (max 15GB).</p>',
      '<p>The AnnData object must contain the following fields and metadata:</p>',
    ],
    dropzoneText: 'Drag and drop *.h5ad file here or click to browse.',
    // setting to null allows file upload on dropzone click
    webkitdirectory: null,
    isNameValid(fileName) {
      return this.validExtensionTypes.some(
        (validExtension) => fileName.endsWith(validExtension),
      );
    },
    getCorrespondingType: () => sampleFileType.ANNDATA_OBJECT,
    // For more information on this one check the TODO1 at FileUploadModal
    filterFiles: () => { throw new Error('Not Implemented'); },
    getFilePathToDisplay: getFilePathToDisplayDefaultConstructor(sampleTech.ANNDATA_OBJECT),
    getFileSampleAndName: getFileSampleAndNameDefault,
  },
  [sampleTech.SEURAT_SPATIAL_OBJECT]: {
    category: techCategoryNames.SPATIAL_PREPROCESSED,
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['<code>scdata@images</code>: used for sample assignment and image data.'],
      ['<code>scdata[[\'Spatial\']]$counts</code>: raw feature counts.'],
      ['<code>DefaultDimReduc(scdata)</code>: is either <code>umap</code>, <code>tsne</code>, or a close match (e.g. <code>ref.umap</code>).'],
      ['\uD83D\uDCA1cluster metadata in <code>scdata@meta.data</code> is auto-detected.'],
      ['\uD83D\uDCA1sample level metadata in <code>scdata@meta.data</code> that groups images is auto-detected for downstream analysis.'],
      ['\uD83D\uDCA1if file size is over 15GB, try removing any assays not indicated above.'],
    ],
    requiredFiles: [sampleFileType.SEURAT_SPATIAL_OBJECT],
    fileUploadParagraphs: [
      '<p class="ant-alert ant-alert-warning">&#128679; Currently supports <code>VisiumV1</code> and <code>VisiumV2</code> images.</p>',
      '<p>For your dataset, upload a single <code>*.rds</code> file with the Seurat object (max 15GB).</p>',
      '<p>The Seurat object must contain the following slots and metadata:</p>',
    ],
    dropzoneText: 'Drag and drop *.rds file here or click to browse.',
    // setting to null allows file upload on dropzone click
    webkitdirectory: null,
    isNameValid(fileName) {
      return this.validExtensionTypes.some(
        (validExtension) => fileName.endsWith(validExtension),
      );
    },
    getCorrespondingType: () => sampleFileType.SEURAT_SPATIAL_OBJECT,
    // For more information on this one check the TODO1 at FileUploadModal
    filterFiles: () => { throw new Error('Not Implemented'); },
    getFilePathToDisplay: getFilePathToDisplayDefaultConstructor(sampleTech.SEURAT_SPATIAL_OBJECT),
    getFileSampleAndName: getFileSampleAndNameDefault,
  },
};

export { techNamesToDisplay };
export default fileUploadUtils;
