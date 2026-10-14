import { createHash, randomUUID } from 'node:crypto';

export class CommerceError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function fail(status: number, code: string, message: string): never { throw new CommerceError(status, code, message); }
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const uuid = () => randomUUID();
export function text(value: unknown, max = 200): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
export function identifier(value: unknown): string {
  const result = text(value, 100);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,99}$/.test(result)) fail(400, 'invalid_identifier', 'Use a valid product or asset identifier.');
  return result;
}
export function idempotency(value: unknown): string {
  const result = text(value, 80);
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(result)) fail(400, 'idempotency_required', 'Provide an Idempotency-Key of 16–80 letters, numbers or hyphens.');
  return result;
}
export function amount(value: unknown, nullable = false): number | null {
  if (nullable && value == null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 100_000_000) fail(400, 'invalid_amount', 'Amounts must be safe integers in the currency minor unit.');
  return value;
}
export const costFields = ['vatRate','percentFees','fixedPayment','delivery','royalty','support','refundLoss','acquisition','contentPerOrder','fixedPerOrder','reward','networkFee','targetSurplus'] as const;
export type CostInputs = Record<typeof costFields[number], number | null> & {contentTotal?:number|null,contentOrders?:number|null,operatingTotal?:number|null,operatingOrders?:number|null};
export function normalizeCosts(input: Record<string, unknown>): CostInputs {
  const result=Object.fromEntries(costFields.map((key) => {
    const value = input[key];
    if (value == null) return [key, null];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (key.endsWith('Rate') || key === 'percentFees' ? value >= 1 : !Number.isSafeInteger(value))) fail(400, 'invalid_cost', `Invalid cost field: ${key}.`);
    return [key, value];
  })) as CostInputs;
  for(const [totalKey,ordersKey,derivedKey]of [['contentTotal','contentOrders','contentPerOrder'],['operatingTotal','operatingOrders','fixedPerOrder']] as const){
    if(!(totalKey in input)&&!(ordersKey in input))continue;
    const total=input[totalKey]==null?null:amount(input[totalKey]),orders=input[ordersKey]==null?null:amount(input[ordersKey]);
    if(orders===0)fail(400,'invalid_allocation_orders','Cost allocation requires a positive expected order count.');
    result[totalKey]=total;result[ordersKey]=orders;result[derivedKey]=total==null||orders==null?null:Math.ceil(total/orders);
  }
  return result;
}
export function costResult(price: number | null, inputs: CostInputs) {
  const missing = costFields.filter((key) => inputs[key] == null);
  const knownFixed = costFields.filter(key => !['vatRate','percentFees','targetSurplus'].includes(key)).reduce((sum,key)=>sum+(inputs[key]??0),0);
  const net = price == null || inputs.vatRate == null ? null : Math.floor(price / (1 + inputs.vatRate));
  const partialSurplus = net == null ? null : net - Math.ceil(price! * (inputs.percentFees ?? 0)) - knownFixed;
  const coefficient = inputs.vatRate == null || inputs.percentFees == null ? null : 1/(1+inputs.vatRate)-inputs.percentFees;
  const complete = missing.length === 0 && price != null && coefficient != null && coefficient > 0;
  const rawHeadroom=complete?Math.floor(partialSurplus!-inputs.targetSurplus!+inputs.reward!):null;
  let minimumPrice=complete?Math.ceil((knownFixed+inputs.targetSurplus!)/coefficient!):null;
  // The algebraic minimum is a lower bound; verify the same conservative minor-unit rounding.
  if(minimumPrice!=null){
    const upper=minimumPrice+Math.ceil(2/coefficient!);
    while(minimumPrice<upper && Math.floor(minimumPrice/(1+inputs.vatRate!))-Math.ceil(minimumPrice*inputs.percentFees!)-knownFixed<inputs.targetSurplus!){
      const required=Math.ceil((knownFixed+inputs.targetSurplus!+Math.ceil(minimumPrice*inputs.percentFees!))*(1+inputs.vatRate!));
      minimumPrice=Math.max(minimumPrice+1,required);
    }
  }
  return {complete,missing,partialSurplusMinor:partialSurplus,surplusMinor:complete?partialSurplus:null,minimumPriceMinor:minimumPrice,rewardHeadroomRawMinor:rawHeadroom,rewardHeadroomMinor:rawHeadroom==null?null:Math.max(0,rawHeadroom),targetMet:complete?partialSurplus!>=inputs.targetSurplus!:null};
}
export function allocate(total: number, weights: number[]): number[] {
  if (!Number.isSafeInteger(total) || total <= 0 || !weights.length || weights.some(x=>!Number.isInteger(x)||x<=0) || weights.reduce((a,b)=>a+b,0)!==10000) fail(400,'invalid_allocation','Component allocations must total 10000 basis points.');
  const result = weights.map(w=>Math.floor(total*w/10000));
  for(let i=0,left=total-result.reduce((a,b)=>a+b,0);left>0;i=(i+1)%result.length,left--) result[i]++;
  if(result.some(x=>x<=0)) fail(400,'invalid_allocation','Each component must have a positive allocated price.');
  return result;
}
export function kruEligibility(input: {market?: string; verified?: boolean; approved?: boolean; channel?: string}) {
  if (!input.market || input.market.toUpperCase()==='CN' || input.channel==='china') return {allowed:false,reason:'KRU is unavailable for China or an unverified market.'};
  if(!input.verified || !input.approved) return {allowed:false,reason:'Market eligibility and activity approval are required.'};
  return {allowed:false,reason:'KRU execution is disabled until verified network, mint, legal approval, budgets and a controlled signer are configured.'};
}
