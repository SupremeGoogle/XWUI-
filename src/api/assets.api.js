/** Manifest-backed asset lookup, shared by domain APIs. Source UI uses IDs, never file paths. */
let manifestPromise;
export async function resolveAssets(ids) {
  manifestPromise ??= fetch(new URL('../../assets/manifest.json', import.meta.url)).then((response) => {
    if (!response.ok) throw new Error('Asset manifest unavailable.');
    return response.json();
  }).catch((error) => { manifestPromise = null; throw error; });
  const manifest = await manifestPromise;
  return Object.fromEntries(ids.map((id) => {
    const entry = manifest.assets.find((asset) => asset.id === id);
    if (!entry) throw new Error(`Unknown asset id: ${id}`);
    return [id, { ...entry, path: new URL(`../../${entry.path}`, import.meta.url).href }];
  }));
}
