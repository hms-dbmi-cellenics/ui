import React from 'react';
import userEvent from '@testing-library/user-event';
import LaunchPathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/LaunchPathwayAnalysisModal';

import {
  render, screen, waitFor,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';
import getDiffExprGenes from 'utils/differentialExpression/getDiffExprGenes';
import { pathwayServices } from 'utils/pathwayAnalysis/pathwayConstants';
import enrichrSpecies from 'utils/pathwayAnalysis/enrichrConstants';
import pushNotificationMessage from 'utils/pushNotificationMessage';

jest.mock('utils/pathwayAnalysis/launchPathwayService');
jest.mock('utils/differentialExpression/getDiffExprGenes');
jest.mock('utils/pushNotificationMessage');

const onCancel = jest.fn();
const onOpenAdvancedFilters = jest.fn();

enableFetchMocks();

const pantherDBResponse = {
  search: {
    output: {
      genomes: {
        genome: [
          {
            name: 'human',
            taxon_id: 9606,
            short_name: 'HUMAN',
            version: 'Reference Proteome 2020_04',
            long_name: 'Homo sapiens',
          },
          {
            name: 'mouse',
            taxon_id: 10090,
            short_name: 'MOUSE',
            version: 'Reference Proteome 2020_04',
            long_name: 'Mus musculus',
          },
          {
            name: 'rat',
            taxon_id: 10116,
            short_name: 'RAT',
            version: 'Reference Proteome 2020_04',
            long_name: 'Rattus norvegicus',
          }],
      },
    },
  },
};

const renderPathwayAnalysisModal = async (filtersApplied = false) => {
  await act(async () => {
    render(
      <Provider store={makeStore()}>
        <LaunchPathwayAnalysisModal
          advancedFiltersAdded={filtersApplied}
          onCancel={onCancel}
          onOpenAdvancedFilters={onOpenAdvancedFilters}
        />
      </Provider>,
    );
  });
};

const genesList = ['gene1', 'gene2'];
getDiffExprGenes.mockImplementation(() => async () => Promise.resolve(genesList));

describe('Pathway analysis modal ', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock(JSON.stringify(pantherDBResponse));
  });

  it('Renders properly', async () => {
    await renderPathwayAnalysisModal();
    expect(screen.getByText('You have not performed any filtering on the genes!')).toBeInTheDocument();

    Object.values(pathwayServices).forEach((serviceName) => {
      expect(screen.getByLabelText(serviceName)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(pathwayServices.PANTHERDB).checked).toEqual(true);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    const closeButton = screen.getAllByLabelText('close')[0];
    closeButton.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('Clicking enrichr radio button removes suggestion text', async () => {
    await renderPathwayAnalysisModal();
    const enrichrRadioButton = screen.getByLabelText(pathwayServices.ENRICHR);
    userEvent.click(enrichrRadioButton);
    await waitFor(() => (
      expect(screen.queryByText('It is strongly recommended to input', { exact: false })).not.toBeInTheDocument()
    ));
  });

  it('Clicking advanced filtering modal opens the modal', async () => {
    await renderPathwayAnalysisModal();
    userEvent.click(screen.getByText('Click here to open the advanced filtering options.'));

    expect(onOpenAdvancedFilters).toHaveBeenCalledTimes(1);
  });

  it('Launches the service with PantherDB', async () => {
    await renderPathwayAnalysisModal();

    const defaultSpecies = 'HUMAN';

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.PANTHERDB,
      genesList,
      defaultSpecies,
    );
  });

  it('Launches the service with enrichr', async () => {
    await renderPathwayAnalysisModal();

    const defaultSpecies = 'sapiens';

    // Choose enrichr and launch the analysis
    userEvent.click(screen.getByText(pathwayServices.ENRICHR));

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.ENRICHR,
      genesList,
      defaultSpecies,
    );
  });

  it('Passes the species key correctly', async () => {
    await renderPathwayAnalysisModal();

    const secondSpecies = enrichrSpecies[enrichrSpecies.length - 1];

    // Choose enrichr
    userEvent.click(screen.getByText(pathwayServices.ENRICHR));

    await act(async () => {
      userEvent.click(screen.getByRole('combobox'));
    });

    // Choose another species
    const speciesOption = screen.getAllByText(secondSpecies.label)[0];
    await act(async () => {
      userEvent.click(speciesOption, undefined, { skipPointerEventsCheck: true });
    });

    // After all is ready, launch
    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.ENRICHR,
      genesList,
      secondSpecies.value,
    );
  });

  it('Passes the number of genes correctly', async () => {
    await renderPathwayAnalysisModal();

    const numGenes = 5;

    // Input to use number of genes
    userEvent.click(screen.getByText('Top'));

    await act(async () => {
      userEvent.type(screen.getByRole('spinbutton'), `{backspace}${numGenes}`);
    });

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(false, numGenes);
  });

  it('Apply filters warning message is not there if there are filters', async () => {
    await renderPathwayAnalysisModal(true);
    expect(screen.queryByText('You have not performed any filtering on the genes!', { exact: false })).not.toBeInTheDocument();
  });

  it('Shows an error if analysis can not be launched', async () => {
    launchPathwayService.mockImplementation(() => { throw new Error('Error launching analysis'); });

    await renderPathwayAnalysisModal(true);

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
  });
});
