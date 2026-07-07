import type { ActionIconItem } from './ActionIconBar';
import { OperacionToolsRail } from './OperacionToolsRail';

export type CocinaToolsRailModel = {
  cocinaActions: ActionIconItem[];
  cocinaHint?: string;
};

/** @deprecated Usa OperacionToolsRail con sectionTitle «Cocina». */
export function CocinaToolsRail({ cocinaActions, cocinaHint }: CocinaToolsRailModel) {
  return (
    <OperacionToolsRail
      sectionTitle="Cocina"
      actions={cocinaActions}
      hint={cocinaHint}
    />
  );
}
