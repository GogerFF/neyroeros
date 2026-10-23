import { createHash } from "node:crypto"; import { db } from "@/lib/db";
/**
 * Rate limiting writes one row per allowed action and counts recent rows. The
 * table grew without bound: nothing ever deleted old events, so both the COUNT
 * and the index grew with every view, forever. Old rows are dropped here on a
 * small fraction of calls - bounded work, amortised, no cron dependency.
 */
let lastSweep = 0;
async function sweepOldEvents(now: number) {
  if (now - lastSweep < 60 * 60 * 1000) return;
  lastSweep = now;
  const cutoff = new Date(now - 24 * 60 * 60 * 1000);
  await db.rateLimitEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => undefined);
}
export async function enforceRateLimit(scope:string,subject:string,limit:number,windowMs:number){const subjectHash=createHash("sha256").update(subject).digest("hex");const now=Date.now();const since=new Date(now-windowMs);const count=await db.rateLimitEvent.count({where:{scope,subjectHash,createdAt:{gte:since}}});if(count>=limit)throw new Error("Слишком много запросов. Попробуйте позже.");await db.rateLimitEvent.create({data:{scope,subjectHash}});void sweepOldEvents(now)}