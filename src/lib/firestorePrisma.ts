import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where as fsWhere,
  orderBy as fsOrderBy,
  limit as fsLimit
} from "firebase/firestore";
import crypto from "crypto";

// Collection mappings for each Prisma model
const MODEL_TO_COLLECTION: Record<string, string> = {
  user: "users",
  startupProfile: "startupProfiles",
  document: "documents",
  department: "departments",
  problem: "problems",
  pitch: "pitches",
  pilot: "pilots",
  kPI: "kpis",
  kPIResult: "kpiResults",
  legalDocument: "legalDocuments",
  solutionPassport: "solutionPassports",
  marketplaceRequest: "marketplaceRequests",
  startupSolution: "startupSolutions",
  startupSolutionRequest: "startupSolutionRequests",
  unregisteredProblem: "unregisteredProblems",
  auditLog: "auditLogs",
  notification: "notifications"
};

// Relation definitions for include / relations
interface RelationDef {
  model: string;
  type: "one" | "many";
  foreignKey: string; // the key on the child or target
  localKey?: string;   // defaults to "id"
}

const RELATIONS: Record<string, Record<string, RelationDef>> = {
  user: {
    startupProfile: { model: "startupProfile", type: "one", foreignKey: "userId" },
    department: { model: "department", type: "one", foreignKey: "id", localKey: "departmentId" },
    authoredProblems: { model: "problem", type: "many", foreignKey: "authorId" },
    notifications: { model: "notification", type: "many", foreignKey: "userId" },
    auditLogs: { model: "auditLog", type: "many", foreignKey: "actorId" }
  },
  startupProfile: {
    user: { model: "user", type: "one", foreignKey: "id", localKey: "userId" },
    documents: { model: "document", type: "many", foreignKey: "startupId" },
    pitches: { model: "pitch", type: "many", foreignKey: "startupId" },
    passports: { model: "solutionPassport", type: "many", foreignKey: "startupId" },
    solutions: { model: "startupSolution", type: "many", foreignKey: "startupId" }
  },
  department: {
    users: { model: "user", type: "many", foreignKey: "departmentId" },
    problems: { model: "problem", type: "many", foreignKey: "departmentId" },
    pilots: { model: "pilot", type: "many", foreignKey: "departmentId" },
    marketplaceRequests: { model: "marketplaceRequest", type: "many", foreignKey: "departmentId" },
    solutionRequests: { model: "startupSolutionRequest", type: "many", foreignKey: "departmentId" }
  },
  problem: {
    department: { model: "department", type: "one", foreignKey: "id", localKey: "departmentId" },
    author: { model: "user", type: "one", foreignKey: "id", localKey: "authorId" },
    pitches: { model: "pitch", type: "many", foreignKey: "problemId" }
  },
  pitch: {
    problem: { model: "problem", type: "one", foreignKey: "id", localKey: "problemId" },
    startup: { model: "startupProfile", type: "one", foreignKey: "id", localKey: "startupId" },
    pilot: { model: "pilot", type: "one", foreignKey: "pitchId" }
  },
  pilot: {
    pitch: { model: "pitch", type: "one", foreignKey: "id", localKey: "pitchId" },
    department: { model: "department", type: "one", foreignKey: "id", localKey: "departmentId" },
    kpis: { model: "kPI", type: "many", foreignKey: "pilotId" },
    legalDocuments: { model: "legalDocument", type: "many", foreignKey: "pilotId" },
    passport: { model: "solutionPassport", type: "one", foreignKey: "pilotId" }
  },
  kPI: {
    pilot: { model: "pilot", type: "one", foreignKey: "id", localKey: "pilotId" },
    results: { model: "kPIResult", type: "many", foreignKey: "kpiId" }
  },
  kPIResult: {
    kpi: { model: "kPI", type: "one", foreignKey: "id", localKey: "kpiId" }
  },
  solutionPassport: {
    pilot: { model: "pilot", type: "one", foreignKey: "id", localKey: "pilotId" },
    startup: { model: "startupProfile", type: "one", foreignKey: "id", localKey: "startupId" },
    marketplaceRequests: { model: "marketplaceRequest", type: "many", foreignKey: "passportId" }
  },
  marketplaceRequest: {
    passport: { model: "solutionPassport", type: "one", foreignKey: "id", localKey: "passportId" },
    department: { model: "department", type: "one", foreignKey: "id", localKey: "departmentId" }
  },
  startupSolution: {
    startup: { model: "startupProfile", type: "one", foreignKey: "id", localKey: "startupId" },
    reviewedBy: { model: "user", type: "one", foreignKey: "id", localKey: "reviewedById" },
    requests: { model: "startupSolutionRequest", type: "many", foreignKey: "solutionId" }
  },
  startupSolutionRequest: {
    solution: { model: "startupSolution", type: "one", foreignKey: "id", localKey: "solutionId" },
    department: { model: "department", type: "one", foreignKey: "id", localKey: "departmentId" }
  },
  notification: {
    user: { model: "user", type: "one", foreignKey: "id", localKey: "userId" }
  },
  auditLog: {
    actor: { model: "user", type: "one", foreignKey: "id", localKey: "actorId" }
  },
  document: {
    startup: { model: "startupProfile", type: "one", foreignKey: "id", localKey: "startupId" }
  },
  legalDocument: {
    pilot: { model: "pilot", type: "one", foreignKey: "id", localKey: "pilotId" }
  }
};

// In-memory cache for fast operations
const cache: Record<string, { docs: any[]; lastFetched: number }> = {};
const CACHE_TTL_MS = 3000; // 3 seconds TTL

function generateId(): string {
  return "c" + crypto.randomBytes(12).toString("hex");
}

async function getCollectionDocs(collectionName: string, forceFresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceFresh && cache[collectionName] && now - cache[collectionName].lastFetched < CACHE_TTL_MS) {
    return cache[collectionName].docs;
  }

  const colRef = collection(db, collectionName);
  const snap = await getDocs(colRef);
  const docs: any[] = [];
  snap.forEach((d) => {
    docs.push({ ...d.data(), id: d.id });
  });

  cache[collectionName] = { docs, lastFetched: now };
  return docs;
}

function updateCacheDoc(collectionName: string, item: any, isDelete = false) {
  if (!cache[collectionName]) return;
  if (isDelete) {
    cache[collectionName].docs = cache[collectionName].docs.filter((d) => d.id !== item.id);
  } else {
    const idx = cache[collectionName].docs.findIndex((d) => d.id === item.id);
    if (idx >= 0) {
      cache[collectionName].docs[idx] = { ...cache[collectionName].docs[idx], ...item };
    } else {
      cache[collectionName].docs.push(item);
    }
  }
}

// Evaluate Prisma `where` clause
function matchesWhere(item: any, whereClause: any, modelName: string): boolean {
  if (!whereClause || Object.keys(whereClause).length === 0) return true;

  for (const [key, value] of Object.entries(whereClause)) {
    if (value === undefined) continue;

    if (key === "AND") {
      if (Array.isArray(value)) {
        if (!value.every((sub) => matchesWhere(item, sub, modelName))) return false;
      } else if (!matchesWhere(item, value, modelName)) {
        return false;
      }
      continue;
    }

    if (key === "OR") {
      if (Array.isArray(value)) {
        if (!value.some((sub) => matchesWhere(item, sub, modelName))) return false;
      }
      continue;
    }

    if (key === "NOT") {
      if (Array.isArray(value)) {
        if (value.some((sub) => matchesWhere(item, sub, modelName))) return false;
      } else if (matchesWhere(item, value, modelName)) {
        return false;
      }
      continue;
    }

    // Relation check in where (e.g. { problem: { departmentId: '...' } } or { pitch: { startupId: '...' } })
    const relation = RELATIONS[modelName]?.[key];
    if (relation && typeof value === "object" && value !== null) {
      const targetCol = MODEL_TO_COLLECTION[relation.model];
      const targetDocs = cache[targetCol]?.docs || [];
      if (relation.type === "one") {
        const localVal = relation.localKey ? item[relation.localKey] : item.id;
        const targetItem = targetDocs.find((t) => t[relation.foreignKey] === localVal);
        if (!targetItem || !matchesWhere(targetItem, value, relation.model)) return false;
      } else if (relation.type === "many") {
        // e.g. pilots: { some: {} }
        const matchingTargets = targetDocs.filter((t) => t[relation.foreignKey] === item.id);
        if ("some" in value) {
          const someWhere = (value as any).some;
          const hasMatch = matchingTargets.some((t) => matchesWhere(t, someWhere, relation.model));
          if (!hasMatch) return false;
        }
      }
      continue;
    }

    const itemVal = item[key];

    if (typeof value === "object" && value !== null) {
      if ("in" in value) {
        if (!Array.isArray((value as any).in) || !(value as any).in.includes(itemVal)) return false;
      } else if ("not" in value) {
        if (itemVal === (value as any).not) return false;
      } else if ("notIn" in value) {
        if (Array.isArray((value as any).notIn) && (value as any).notIn.includes(itemVal)) return false;
      } else if ("contains" in value) {
        const needle = String((value as any).contains).toLowerCase();
        if (!String(itemVal || "").toLowerCase().includes(needle)) return false;
      } else if ("gte" in value) {
        if (itemVal < (value as any).gte) return false;
      } else if ("lte" in value) {
        if (itemVal > (value as any).lte) return false;
      } else if ("gt" in value) {
        if (itemVal <= (value as any).gt) return false;
      } else if ("lt" in value) {
        if (itemVal >= (value as any).lt) return false;
      }
    } else {
      if (itemVal !== value) return false;
    }
  }

  return true;
}

// Sort documents
function sortDocs(docs: any[], orderBy: any): any[] {
  if (!orderBy) return docs;

  const orderRules = Array.isArray(orderBy) ? orderBy : [orderBy];

  return [...docs].sort((a, b) => {
    for (const rule of orderRules) {
      for (const [field, direction] of Object.entries(rule)) {
        const valA = a[field];
        const valB = b[field];
        const dir = String(direction).toLowerCase() === "desc" ? -1 : 1;

        if (valA === undefined || valA === null) return 1 * dir;
        if (valB === undefined || valB === null) return -1 * dir;

        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
      }
    }
    return 0;
  });
}

// Apply includes / joins
async function applyIncludes(items: any[], include: any, modelName: string): Promise<any[]> {
  if (!include || Object.keys(include).length === 0) return items;

  const result = [];
  for (const item of items) {
    const itemCopy = { ...item };

    for (const [relKey, relConfig] of Object.entries(include)) {
      if (!relConfig) continue;

      const relation = RELATIONS[modelName]?.[relKey];
      if (!relation) continue;

      const targetCol = MODEL_TO_COLLECTION[relation.model];
      const targetDocs = await getCollectionDocs(targetCol);

      if (relation.type === "one") {
        const localVal = relation.localKey ? itemCopy[relation.localKey] : itemCopy.id;
        const target = targetDocs.find((t) => t[relation.foreignKey] === localVal) || null;

        if (target && typeof relConfig === "object" && relConfig !== null) {
          let enriched = target;
          const config = relConfig as any;
          if (config.include) {
            [enriched] = await applyIncludes([enriched], config.include, relation.model);
          }
          if (config.select) {
            enriched = applySelect([enriched], config.select)[0];
          }
          itemCopy[relKey] = enriched;
        } else {
          itemCopy[relKey] = target;
        }
      } else if (relation.type === "many") {
        let targets = targetDocs.filter((t) => t[relation.foreignKey] === itemCopy.id);

        if (typeof relConfig === "object" && relConfig !== null) {
          const config = relConfig as any;
          if (config.where) {
            targets = targets.filter((t) => matchesWhere(t, config.where, relation.model));
          }
          if (config.orderBy) {
            targets = sortDocs(targets, config.orderBy);
          }
          if (config.take !== undefined) {
            const skip = config.skip || 0;
            targets = targets.slice(skip, skip + config.take);
          }
          if (config.include) {
            targets = await applyIncludes(targets, config.include, relation.model);
          }
          if (config.select) {
            targets = applySelect(targets, config.select);
          }
        }

        itemCopy[relKey] = targets;
      }
    }
    result.push(itemCopy);
  }

  return result;
}

// Apply select projections
function applySelect(items: any[], select: any): any[] {
  if (!select) return items;

  return items.map((item) => {
    const projected: Record<string, any> = {};
    for (const [key, val] of Object.entries(select)) {
      if (val === true) {
        projected[key] = item[key];
      }
    }
    return projected;
  });
}

// Create a Model Delegate
function createModelDelegate(modelName: string) {
  const colName = MODEL_TO_COLLECTION[modelName];

  return {
    async findMany(args?: {
      where?: any;
      include?: any;
      select?: any;
      orderBy?: any;
      take?: number;
      skip?: number;
      distinct?: string[];
    }) {
      let docs = await getCollectionDocs(colName);

      // Pre-warm caches for relation lookups if where has nested relations
      if (args?.where) {
        for (const k of Object.keys(args.where)) {
          const rel = RELATIONS[modelName]?.[k];
          if (rel) {
            await getCollectionDocs(MODEL_TO_COLLECTION[rel.model]);
          }
        }
      }

      if (args?.where) {
        docs = docs.filter((d) => matchesWhere(d, args.where, modelName));
      }

      if (args?.distinct && Array.isArray(args.distinct)) {
        const seen = new Set<string>();
        docs = docs.filter((d) => {
          const key = args.distinct!.map((f) => String(d[f])).join("::");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      if (args?.orderBy) {
        docs = sortDocs(docs, args.orderBy);
      }

      if (args?.skip || args?.take !== undefined) {
        const skip = args.skip || 0;
        const take = args.take !== undefined ? args.take : docs.length;
        docs = docs.slice(skip, skip + take);
      }

      if (args?.include) {
        docs = await applyIncludes(docs, args.include, modelName);
      }

      if (args?.select) {
        docs = applySelect(docs, args.select);
      }

      return docs;
    },

    async findFirst(args?: { where?: any; include?: any; select?: any; orderBy?: any }) {
      const results = await this.findMany({ ...args, take: 1 });
      return results[0] || null;
    },

    async findUnique(args: { where: any; include?: any; select?: any }) {
      return this.findFirst(args);
    },

    async count(args?: { where?: any }) {
      let docs = await getCollectionDocs(colName);
      if (args?.where) {
        // Pre-warm caches if needed
        for (const k of Object.keys(args.where)) {
          const rel = RELATIONS[modelName]?.[k];
          if (rel) {
            await getCollectionDocs(MODEL_TO_COLLECTION[rel.model]);
          }
        }
        docs = docs.filter((d) => matchesWhere(d, args.where, modelName));
      }
      return docs.length;
    },

    async create(args: { data: any; include?: any }) {
      const data = { ...args.data };
      const id = data.id || generateId();
      data.id = id;

      const now = new Date().toISOString();
      if (!data.createdAt) data.createdAt = now;
      if (!data.updatedAt) data.updatedAt = now;

      // Handle autoincrement psNumber for problem
      if (modelName === "problem" && data.psNumber === undefined) {
        const allProblems = await getCollectionDocs(colName);
        const maxPs = allProblems.reduce((max, p) => Math.max(max, p.psNumber || 0), 0);
        data.psNumber = maxPs + 1;
      }

      const docRef = doc(db, colName, id);
      await setDoc(docRef, data);
      updateCacheDoc(colName, data);

      if (args.include) {
        const [enriched] = await applyIncludes([data], args.include, modelName);
        return enriched;
      }
      return data;
    },

    async createMany(args: { data: any[] }) {
      const results = [];
      for (const item of args.data) {
        results.push(await this.create({ data: item }));
      }
      return { count: results.length };
    },

    async update(args: { where: any; data: any; include?: any }) {
      const existing = await this.findUnique({ where: args.where });
      if (!existing) {
        throw new Error(`Record to update not found in ${modelName}`);
      }

      const updated = {
        ...existing,
        ...args.data,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, colName, existing.id);
      await setDoc(docRef, updated);
      updateCacheDoc(colName, updated);

      if (args.include) {
        const [enriched] = await applyIncludes([updated], args.include, modelName);
        return enriched;
      }
      return updated;
    },

    async updateMany(args: { where: any; data: any }) {
      const docs = await this.findMany({ where: args.where });
      for (const d of docs) {
        await this.update({ where: { id: d.id }, data: args.data });
      }
      return { count: docs.length };
    },

    async upsert(args: { where: any; create: any; update: any; include?: any }) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        return this.update({ where: args.where, data: args.update, include: args.include });
      } else {
        return this.create({ data: args.create, include: args.include });
      }
    },

    async delete(args: { where: any }) {
      const existing = await this.findUnique({ where: args.where });
      if (!existing) {
        throw new Error(`Record to delete not found in ${modelName}`);
      }

      const docRef = doc(db, colName, existing.id);
      await deleteDoc(docRef);
      updateCacheDoc(colName, existing, true);

      return existing;
    },

    async deleteMany(args?: { where?: any }) {
      const docs = await this.findMany(args);
      for (const d of docs) {
        await this.delete({ where: { id: d.id } });
      }
      return { count: docs.length };
    },

    async groupBy(args: { by: string[]; where?: any; _count?: any }) {
      let docs = await getCollectionDocs(colName);
      if (args.where) {
        for (const k of Object.keys(args.where)) {
          const rel = RELATIONS[modelName]?.[k];
          if (rel) {
            await getCollectionDocs(MODEL_TO_COLLECTION[rel.model]);
          }
        }
        docs = docs.filter((d) => matchesWhere(d, args.where, modelName));
      }

      const groups: Record<string, { keyValues: Record<string, any>; count: number }> = {};
      for (const d of docs) {
        const key = args.by.map((f) => String(d[f])).join("::");
        if (!groups[key]) {
          const keyValues: Record<string, any> = {};
          for (const f of args.by) {
            keyValues[f] = d[f];
          }
          groups[key] = { keyValues, count: 0 };
        }
        groups[key].count++;
      }

      return Object.values(groups).map((g) => ({
        ...g.keyValues,
        _count: { _all: g.count }
      }));
    }
  };
}

// Construct the Prisma-compatible client backed by Firestore
export function createFirestorePrismaClient(): any {
  const delegates: Record<string, any> = {};

  for (const model of Object.keys(MODEL_TO_COLLECTION)) {
    delegates[model] = createModelDelegate(model);
  }

  return {
    ...delegates,
    async $transaction(arg: any[] | ((tx: any) => Promise<any>)) {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      if (typeof arg === "function") {
        return arg(this);
      }
      throw new Error("Invalid transaction argument");
    },
    async $disconnect() {
      // No-op for Firestore
    }
  };
}

export const firestorePrisma = createFirestorePrismaClient();
