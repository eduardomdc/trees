import {type TreeParams} from './penn.ts'

export const preset_paths : Record<string, string> = {
  "Quaking Aspen": import.meta.env.BASE_URL + "/garden/quaking_aspen.json",
  "Japanese Maple": import.meta.env.BASE_URL + "/garden/japanese_maple.json",
  "Raphis": import.meta.env.BASE_URL + "/garden/raphis.json",
  "Weeping Willow": import.meta.env.BASE_URL + "/garden/weeping_willow.json",
  "Araucária": import.meta.env.BASE_URL + "/garden/araucaria.json",
  "Mangrove": import.meta.env.BASE_URL + "/garden/mangrove.json",
  "Coconut Tree": import.meta.env.BASE_URL + "/garden/coconut.json",
  "Ficus": import.meta.env.BASE_URL + "/garden/ficus.json",
  "Ipê Amarelo": import.meta.env.BASE_URL + "/garden/ipe_amarelo.json",
  "Jequitibá": import.meta.env.BASE_URL + "/garden/jequitiba.json",
  "Pau Brasil": import.meta.env.BASE_URL + "/garden/pau_brasil.json",
  "Pine": import.meta.env.BASE_URL + "/garden/pine.json",
};

async function loadAllPresets(): Promise<Record<string, TreeParams>> {
  const entries = await Promise.all(
    Object.entries(preset_paths).map(async ([name, path]) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to load "${name}" from ${path}`);
      return [name, await res.json() as TreeParams] as const;
    })
  );
  return Object.fromEntries(entries);
}

export const presets : Record<string, TreeParams> = await loadAllPresets();
