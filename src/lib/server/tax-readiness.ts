import type { User } from './auth';
import { CommerceError, costFields, fail, normalizeCosts } from './core';
import { query } from './db';
import {
  automaticTaxCheckoutImplemented, automaticTaxPreparationGaps,
  commerceTaxMode, normalizeAutomaticTaxPreparation,
} from './global-tax';

type PreparationRow = {
  id: string; title: string; status: string; components: unknown;
  inputs: unknown; tax_mode: unknown; automatic_tax_config: unknown;
};
const maximumItems = 200;
const gapLabels: Record<string, string> = {
  component_tax_classification: 'Review the tax classification of every included edition.',
  actual_registration_and_jurisdiction_coverage: 'Record the reviewed registration and coverage for each intended destination.',
  swedish_place_of_supply_scheme: 'Confirm the exact Swedish place-of-supply scheme.',
  swedish_cross_border_small_seller_evidence: 'Confirm Swedish cross-border eligibility, both years of combined sales and any destination-tax election.',
  tax_service_cost_and_before_payment_budget: 'Record tax-service fees and the approved before-payment budget.',
  separate_sandbox_verification: 'Record a completed separate sandbox review.',
};
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function summarize(row: PreparationRow, migrationApplied: boolean) {
  // Explicit output fields only. Never return original evidence, registration
  // identities, account/address data, arbitrary JSON properties or error text.
  let taxSetup = 'Manual tax setup', preparationStatus = 'Automatic-tax preparation is not required for the existing manual flow.';
  let preparationComplete: boolean | null = null;
  const gaps: string[] = [], unknownSmallSellerFacts = new Set<string>();
  let automatic = false;
  try { automatic = commerceTaxMode(row.tax_mode) === 'stripe_automatic'; }
  catch { taxSetup = 'Unrecognized tax setup'; preparationStatus = 'The saved tax setup needs correction.'; gaps.push('invalid_tax_mode'); }
  if (automatic) {
    taxSetup = 'Automatic-tax preparation';
    if (!migrationApplied) { preparationStatus = 'The preparation database update has not been applied.'; gaps.push('preparation_schema_pending'); }
    else {
      try {
        if (!Array.isArray(row.components) || !row.components.length || row.components.length > 100) throw new Error('Invalid components');
        const assetIds = row.components.map(component => {
          if (!record(component) || typeof component.assetId !== 'string') throw new Error('Invalid component');
          return component.assetId;
        });
        if (new Set(assetIds).size !== assetIds.length) throw new Error('Duplicate components');
        const preparation = normalizeAutomaticTaxPreparation(row.automatic_tax_config, assetIds);
        const missing = automaticTaxPreparationGaps(preparation, assetIds);
        gaps.push(...missing); preparationComplete = missing.length === 0;
        preparationStatus = !record(row.automatic_tax_config) || !Object.keys(row.automatic_tax_config).length
          ? 'Preparation has not been saved.'
          : preparationComplete ? 'Required review fields are recorded. Actual merchant evidence is still unverified.' : 'Preparation is incomplete.';
        for (const jurisdiction of preparation.jurisdictions) {
          if (jurisdiction.registrationCountry !== 'SE' || jurisdiction.registrationType !== 'standard' || jurisdiction.country === 'SE') continue;
          const coverage = jurisdiction.smallSellerCoverage;
          for (const [key, label] of [
            ['establishedOnlyInSweden', 'Swedish-only establishment'],
            ['destinationCountryTaxElectionMade', 'Destination-country tax election'],
            ['aggregationScope', 'Combined sales scope across all relevant channels'],
            ['currency', 'Threshold currency'], ['currentCalendarYear', 'Current calendar year'],
            ['currentYearExVatSalesMinor', 'Current-year combined sales excluding VAT'],
            ['previousCalendarYear', 'Previous calendar year'],
            ['previousYearExVatSalesMinor', 'Previous-year combined sales excluding VAT'],
          ] as const) if (coverage?.[key] == null) unknownSmallSellerFacts.add(label);
        }
      } catch (error) {
        preparationStatus = 'Saved preparation is invalid and needs correction.';
        // A known validation code is diagnostic; its message may contain input.
        gaps.push(error instanceof CommerceError ? error.code : 'invalid_tax_preparation');
        preparationComplete = false;
      }
    }
    // Recording reviews cannot remove the implementation lock or approve money.
    gaps.push('automatic_tax_checkout_not_implemented');
  }
  const requiredCosts = costFields.filter(key => !automatic || key !== 'vatRate');
  let missingCosts: string[] = [...requiredCosts], costStatus = 'Costs have not been recorded.', costInputsComplete = false;
  if (row.inputs != null) {
    try {
      if (!record(row.inputs)) throw new Error('Invalid cost record');
      const inputs = normalizeCosts(row.inputs);
      missingCosts = requiredCosts.filter(key => inputs[key] == null);
      costInputsComplete = missingCosts.length === 0;
      costStatus = costInputsComplete ? 'Required cost inputs are recorded. Actual quote profitability is not verified by this report.' : `Incomplete: ${missingCosts.length} required cost inputs remain unknown.`;
    } catch { costStatus = 'Saved cost inputs are invalid and need correction.'; gaps.push('invalid_cost_record'); }
  }
  if (!costInputsComplete) gaps.push('costs_incomplete');
  return {
    id: row.id, title: row.title, publication_status: row.status, tax_setup: taxSetup,
    preparation_status: preparationStatus, cost_status: costStatus,
    merchant_evidence: 'Not verified by this report.',
    needs_attention: [...gaps.map(gap => gapLabels[gap] ?? ({
      preparation_schema_pending: 'Apply the reviewed preparation database update before recording automatic-tax preparation.',
      automatic_tax_checkout_not_implemented: 'Automatic-tax checkout remains unavailable.',
      costs_incomplete: 'Complete the actual cost record; unknown values are not zero.',
      invalid_cost_record: 'Correct the saved cost inputs.',
    } as Record<string, string>)[gap] ?? 'Correct the saved tax preparation.'), ...[...unknownSmallSellerFacts].map(fact => `Unknown: ${fact}.`)],
    preparationComplete, costInputsComplete, missingCostFields: missingCosts,
    preparationGapCodes: gaps, unknownSmallSellerFacts: [...unknownSmallSellerFacts],
    merchantRegistrationVerified: null, actualQuoteProfitabilityVerified: null,
    taxRegistrationCompleted: null, taxFilingCompleted: null,
    automaticTaxCheckoutImplemented, automaticTaxCollectionEnabled: false,
  };
}

export async function taxReadiness(user: User) {
  if (user.role !== 'admin' || !user.brands.includes('karuu')) fail(403, 'brand_denied', 'Approved KARUU administrator access is required for tax preparation records.');
  const migrationApplied = Boolean((await query('SELECT version FROM commerce_schema WHERE version=3'))[0]);
  // Old/v2 databases do not have the preparation columns. Read only known base
  // columns until the actual migration marker exists; never run or infer DDL.
  const extra = migrationApplied ? 's.tax_mode,s.automatic_tax_config' : 'NULL::text AS tax_mode,NULL::jsonb AS automatic_tax_config';
  const rows = await query<PreparationRow>(`SELECT s.id,s.title,s.status,s.components,c.inputs,${extra}
    FROM commerce_skus s LEFT JOIN commerce_costs c ON c.sku_id=s.id
    ORDER BY s.updated_at DESC,s.id LIMIT 201`);
  return {
    scope: 'Tax preparation review only. This report does not verify a registration, collect tax, complete a filing or approve sales.',
    preparationSchemaApplied: migrationApplied,
    schemaStatus: migrationApplied ? 'Preparation records can be read.' : 'The preparation database update has not been applied; the existing manual setup is shown.',
    automaticTaxCheckoutImplemented, automaticTaxCollectionEnabled: false,
    providerEvidenceChecked: false, taxRegistrationCompleted: null, taxFilingCompleted: null,
    limit: maximumItems, truncated: rows.length > maximumItems,
    items: rows.slice(0, maximumItems).map(row => summarize(row, migrationApplied)),
  };
}
