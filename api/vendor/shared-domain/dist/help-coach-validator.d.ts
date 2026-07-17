export type CoachValidationIssueKind = 'orphan_target' | 'orphan_signal' | 'orphan_screen' | 'missing_target_registration' | 'dynamic_target_ok' | 'step_without_completion' | 'screen_without_signal';
export type CoachValidationIssue = {
    kind: CoachValidationIssueKind;
    severity: 'error' | 'warning' | 'info';
    guideId?: string;
    stepIndex?: number;
    stepTitle?: string;
    message: string;
    suggestion?: string;
};
export type CoachValidationReport = {
    ok: boolean;
    errorCount: number;
    warningCount: number;
    issues: CoachValidationIssue[];
    stats: {
        guides: number;
        steps: number;
        targetsInManifest: number;
        screensInManifest: number;
        registeredTargetIds: string[];
        unregisteredTargetIds: string[];
    };
};
/** Valida tutoriales contra el manifest y opcionalmente targets registrados en código. */
export declare function validarCoachManifest(opts?: {
    registeredTargetIds?: string[];
    pathname?: string;
}): CoachValidationReport;
export declare function formatearReporteCoach(report: CoachValidationReport): string;
