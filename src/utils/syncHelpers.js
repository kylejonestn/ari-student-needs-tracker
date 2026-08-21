// src/utils/syncHelpers.js
/**
 * Merge local and cloud arrays of entities (students, screenings, etc.) based on `id`.
 * Returns { merged: Array, conflicts: Array } where each conflict is { id, local, cloud }.
 * If both have same updatedAt, treat as conflict (different payload). If timestamps differ, newer wins.
 */
export function mergeWithCloud(localArray, cloudArray) {
  const localMap = new Map();
  (localArray || []).forEach(item => {
    if (item && item.id) localMap.set(item.id, item);
  });
  const cloudMap = new Map();
  (cloudArray || []).forEach(item => {
    if (item && item.id) cloudMap.set(item.id, item);
  });

  const merged = [];
  const conflicts = [];

  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
  allIds.forEach(id => {
    const local = localMap.get(id);
    const cloud = cloudMap.get(id);
    if (local && cloud) {
      const localTS = local.updatedAt || '';
      const cloudTS = cloud.updatedAt || '';
      if (localTS && cloudTS) {
        if (localTS > cloudTS) {
          merged.push(local);
        } else if (cloudTS > localTS) {
          merged.push(cloud);
        } else {
          // timestamps equal but payload may differ => conflict
          conflicts.push({ id, local, cloud });
          // keep local for now; will be replaced after resolution
          merged.push(local);
        }
      } else {
        // fallback to prefer local if no timestamps
        merged.push(local);
      }
    } else if (local) {
      merged.push(local);
    } else if (cloud) {
      merged.push(cloud);
    }
  });

  return { merged, conflicts };
}

/**
 * Apply user's conflict resolutions.
 * `resolutions` is a map id -> 'local' | 'cloud'.
 * If `bulkNewest` is true, all conflicts resolved to whichever side has newer `updatedAt`.
 */
export function applyResolution(mergedArray, conflicts, resolutions = {}, bulkNewest = false) {
  const mergedMap = new Map();
  mergedArray.forEach(item => {
    if (item && item.id) mergedMap.set(item.id, item);
  });

  conflicts.forEach(conf => {
    const { id, local, cloud } = conf;
    let chosen;
    if (bulkNewest) {
      const localTS = local.updatedAt || '';
      const cloudTS = cloud.updatedAt || '';
      chosen = localTS >= cloudTS ? local : cloud;
    } else {
      const decision = resolutions[id];
      if (decision === 'cloud') chosen = cloud;
      else chosen = local; // default or explicit local
    }
    mergedMap.set(id, chosen);
  });

  return Array.from(mergedMap.values());
}
