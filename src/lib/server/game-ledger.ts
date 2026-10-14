import { fail, hash, idempotency, identifier, uuid } from './core';
import { DbClient, transaction } from './db';

export type GameRules={gameId:string,version:string,approved:boolean,spendOrder:'paid-first'|'gift-first'};
function rulesCheck(rules:GameRules){
  if(!rules.approved||!rules.version||!['paid-first','gift-first'].includes(rules.spendOrder))fail(503,'game_rules_unconfirmed','The actual game rules and explicit paid/gift consumption order require approval.');
  identifier(rules.gameId);
}
function units(value:string){if(!/^[1-9]\d{0,17}$/.test(value))fail(400,'invalid_points','Use a positive whole-number point quantity.');return BigInt(value);}
async function replay(client:DbClient,key:string,digest:string){
  const old=(await client.query('SELECT request_hash,result FROM commerce_point_operations WHERE event_key=$1',[key])).rows[0];
  if(old&&old.request_hash!==digest)fail(409,'point_operation_conflict','This point operation was already used for another instruction.');return old?.result;
}
async function record(client:DbClient,key:string,digest:string,result:unknown){await client.query('INSERT INTO commerce_point_operations(event_key,request_hash,result) VALUES($1,$2,$3)',[key,digest,JSON.stringify(result)]);}
async function lockUser(client:DbClient,userId:string){if(!(await client.query('SELECT id FROM commerce_users WHERE id=$1 FOR UPDATE',[userId])).rows[0])fail(404,'account_not_found','No account exists for this ledger operation.');}
// Server-only primitives. No public credit/recharge endpoint or game adapter calls these yet.
export async function creditConfirmedGameFunding(userId:string,fundingId:string,eventKey:string,rules:GameRules){
  rulesCheck(rules);const key=idempotency(eventKey),digest=hash(JSON.stringify({userId,fundingId,gameId:rules.gameId,version:rules.version}));
  return transaction(async client=>{
    await lockUser(client,userId);const old=await replay(client,key,digest);if(old)return old;
    const funding=(await client.query('SELECT * FROM commerce_game_funding WHERE id=$1 FOR UPDATE',[fundingId])).rows[0];
    if(!funding||funding.user_id!==userId||funding.game_id!==rules.gameId||funding.rules_version!==rules.version||funding.status!=='confirmed')fail(409,'funding_not_verified','A matching confirmed funding record is required.');
    const exists=await client.query("SELECT id FROM commerce_point_ledger WHERE funding_source_id=$1 AND source='paid' AND units>0",[funding.original_funding_id]);
    if(exists.rows.length)fail(409,'funding_already_credited','These paid funds were already credited. Consuming points cannot credit the receipt again.');
    const id=uuid();await client.query(`INSERT INTO commerce_point_ledger(id,user_id,game_id,source,units,event_key,funding_source_id,rules_version) VALUES($1,$2,$3,'paid',$4,$5,$6,$7)`,[id,userId,rules.gameId,funding.units,key,funding.original_funding_id,rules.version]);
    const result={id,gameId:rules.gameId,source:'paid',units:String(funding.units)};await record(client,key,digest,result);return result;
  });
}
export async function grantGameFundingReward(userId:string,fundingId:string,campaignId:string,eventKey:string,rules:GameRules){
  rulesCheck(rules);const key=idempotency(eventKey),digest=hash(JSON.stringify({userId,fundingId,campaignId,gameId:rules.gameId,version:rules.version}));
  return transaction(async client=>{
    await lockUser(client,userId);const old=await replay(client,key,digest);if(old)return old;
    const funding=(await client.query('SELECT * FROM commerce_game_funding WHERE id=$1 FOR UPDATE',[fundingId])).rows[0];
    if(!funding||funding.status!=='confirmed'||funding.user_id!==userId||funding.game_id!==rules.gameId||funding.rules_version!==rules.version)fail(409,'funding_not_verified','Reward eligibility requires matching confirmed original funds.');
    const campaign=(await client.query('SELECT * FROM commerce_game_campaigns WHERE id=$1 FOR UPDATE',[campaignId])).rows[0];
    if(!campaign?.active||campaign.game_id!==rules.gameId||campaign.rules_version!==rules.version)fail(503,'campaign_unavailable','No approved matching game reward campaign is active.');
    const claimed=await client.query('SELECT credit_id FROM commerce_game_reward_claims WHERE campaign_id=$1 AND (user_id=$2 OR original_funding_id=$3)',[campaignId,userId,funding.original_funding_id]);
    if(claimed.rows.length)fail(409,'reward_already_claimed','This account or original funding already received this campaign reward.');
    if(BigInt(campaign.used_units)+BigInt(campaign.reward_units)>BigInt(campaign.budget_units))fail(409,'point_budget_exhausted','The internal game-point quantity budget is exhausted.');
    const id=uuid();await client.query(`INSERT INTO commerce_point_ledger(id,user_id,game_id,source,units,event_key,funding_source_id,rules_version) VALUES($1,$2,$3,'gift',$4,$5,$6,$7)`,[id,userId,rules.gameId,campaign.reward_units,key,funding.original_funding_id,rules.version]);
    await client.query('INSERT INTO commerce_game_reward_claims(campaign_id,user_id,original_funding_id,credit_id) VALUES($1,$2,$3,$4)',[campaignId,userId,funding.original_funding_id,id]);
    await client.query('UPDATE commerce_game_campaigns SET used_units=used_units+$2 WHERE id=$1',[campaignId,campaign.reward_units]);
    const result={id,gameId:rules.gameId,source:'gift',units:String(campaign.reward_units)};await record(client,key,digest,result);return result;
  });
}
async function lots(client:DbClient,userId:string,gameId:string){return (await client.query(`SELECT c.id,c.source,c.expires_at,c.created_at,c.funding_source_id,c.units+COALESCE((SELECT sum(d.units) FROM commerce_point_ledger d WHERE d.lot_id=c.id),0) AS available
  FROM commerce_point_ledger c WHERE c.user_id=$1 AND c.game_id=$2 AND c.units>0 AND (c.expires_at IS NULL OR c.expires_at>now()) ORDER BY c.created_at,c.id`,[userId,gameId])).rows;}
export async function spendGamePoints(userId:string,quantity:string,eventKey:string,rules:GameRules){
  rulesCheck(rules);const wanted=units(quantity),key=idempotency(eventKey),digest=hash(JSON.stringify({userId,quantity,gameId:rules.gameId,version:rules.version,spendOrder:rules.spendOrder}));
  return transaction(async client=>{
    await lockUser(client,userId);const old=await replay(client,key,digest);if(old)return old;
    const available=await lots(client,userId,rules.gameId);
    if(available.reduce((sum,lot)=>sum+BigInt(lot.available),BigInt(0))<wanted)fail(409,'insufficient_game_points','There are not enough unexpired points in this specific game.');
    const first=rules.spendOrder==='paid-first'?'paid':'gift';available.sort((a,b)=>Number(b.source===first)-Number(a.source===first));
    let remaining=wanted,paid=BigInt(0),gift=BigInt(0);
    for(const lot of available){if(!remaining)break;const balance=BigInt(lot.available);if(balance<=0)continue;const take=balance<remaining?balance:remaining;
      await client.query('INSERT INTO commerce_point_ledger(id,user_id,game_id,source,units,event_key,lot_id,funding_source_id,rules_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[uuid(),userId,rules.gameId,lot.source,(-take).toString(),`${key}:${lot.id}`,lot.id,lot.funding_source_id,rules.version]);
      if(lot.source==='paid')paid+=take;else gift+=take;remaining-=take;
    }
    const result={gameId:rules.gameId,spentPaid:paid.toString(),spentGift:gift.toString()};await record(client,key,digest,result);return result;
  });
}
export async function gamePointBalance(userId:string,gameId:string){identifier(gameId);return transaction(async client=>{await lockUser(client,userId);const available=await lots(client,userId,gameId);return {gameId,paid:available.filter(l=>l.source==='paid').reduce((sum,l)=>sum+BigInt(l.available),BigInt(0)).toString(),gift:available.filter(l=>l.source==='gift').reduce((sum,l)=>sum+BigInt(l.available),BigInt(0)).toString()};});}
