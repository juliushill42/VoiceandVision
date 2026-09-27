export const TITAN_TRACKS = [
  { slot: 0, id: "soprano", label: "Soprano", group: "choir" },
  { slot: 1, id: "alto", label: "Alto", group: "choir" },
  { slot: 2, id: "tenor", label: "Tenor", group: "choir" },
  { slot: 3, id: "adlibs", label: "Ad-libs", group: "choir" },
  { slot: 4, id: "main", label: "Main", group: "choir" },
  { slot: 5, id: "doubles", label: "Doubles", group: "choir" },
  { slot: 6, id: "humming", label: "Humming", group: "choir" },
  { slot: 7, id: "beat", label: "Beat", group: "choir" },
  { slot: 8, id: "voiceover", label: "Voice Over", group: "choir" },
  { slot: 9, id: "harmony", label: "Harmony", group: "rack" },
  { slot: 10, id: "crowd", label: "Crowd", group: "rack" },
  { slot: 11, id: "room", label: "Room", group: "rack" },
  { slot: 12, id: "fx", label: "FX", group: "rack" },
  { slot: 13, id: "sub", label: "Sub", group: "rack" },
  { slot: 14, id: "pad", label: "Pad", group: "rack" },
  { slot: 15, id: "print", label: "Print", group: "rack" },
] as const;

export type TitanStrip = {
  slot: number; id: string; label: string; gainDb: number; pan: number;
  mute: boolean; solo: boolean; arm: boolean; hpHz: number; gateDb: number;
};

export function defaultStrips(): TitanStrip[] {
  return TITAN_TRACKS.map((t) => ({
    slot: t.slot, id: t.id, label: t.label, gainDb: 0, pan: 0, mute: false, solo: false,
    arm: t.id === "main", hpHz: t.id === "beat" ? 30 : 85, gateDb: t.id === "beat" ? -60 : -38,
  }));
}
