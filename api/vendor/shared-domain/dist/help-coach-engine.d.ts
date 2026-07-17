import type { HelpTutorialStep } from './help-tutorials';
import { type HelpManifestTarget } from './help-manifest';
import type { HelpProgressSignals } from './help-coach';
export type CoachTargetRuntimeState = {
    registered: boolean;
    visible: boolean;
    enabled: boolean;
    inViewport: boolean;
    layout: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
};
export type CoachStepBlockReason = 'no_target' | 'not_registered' | 'not_visible' | 'disabled' | 'off_viewport' | 'wrong_screen' | 'needs_navigation' | 'needs_hub' | 'needs_more_menu' | 'waiting_load' | 'educational_only';
export type CoachStepReadiness = {
    targetId: string | null;
    targetMeta: HelpManifestTarget | null;
    canHighlight: boolean;
    canInteract: boolean;
    shouldScroll: boolean;
    blockedReason: CoachStepBlockReason | null;
    suggestion: string | null;
};
export type EvaluarPasoCoachInput = {
    step: HelpTutorialStep;
    stepIndex: number;
    currentScreenId: string | null;
    view: 'hub' | 'steps';
    signals: HelpProgressSignals;
    targetRuntime?: CoachTargetRuntimeState | null;
};
/** Evalúa si el paso puede resaltarse / interactuarse según manifest + estado runtime. */
export declare function evaluarPreparacionPasoCoach(input: EvaluarPasoCoachInput): CoachStepReadiness;
/** ¿El rect está dentro del viewport con margen? */
export declare function layoutEnViewport(layout: {
    x: number;
    y: number;
    width: number;
    height: number;
}, viewportW: number, viewportH: number, margin?: number): boolean;
