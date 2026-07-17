"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarCoachManifest = validarCoachManifest;
exports.formatearReporteCoach = formatearReporteCoach;
const help_manifest_1 = require("./help-manifest");
const help_tutorials_1 = require("./help-tutorials");
const help_navigation_1 = require("./help-navigation");
function collectStepsFromGuide(guideId, pathname, rol) {
    if (guideId.startsWith('module:')) {
        return (0, help_navigation_1.pasosCoachModulo)(guideId.replace('module:', ''), pathname, rol);
    }
    return (0, help_navigation_1.pasosCoachAccion)(guideId, pathname, rol);
}
function allGuideIds() {
    const out = [];
    for (const mod of help_tutorials_1.HELP_TUTORIAL_MODULES) {
        for (const rol of mod.roles) {
            if (rol === 'superadmin')
                continue;
            out.push({ id: `module:${mod.id}`, rol: rol });
        }
    }
    for (const action of help_tutorials_1.HELP_TUTORIAL_ACTIONS) {
        for (const rol of action.roles) {
            if (rol === 'superadmin')
                continue;
            out.push({ id: action.id, rol: rol });
        }
    }
    return out;
}
function signalsFromListoSi(listoSi) {
    return listoSi.split('|').map((s) => s.trim()).filter(Boolean);
}
/** Valida tutoriales contra el manifest y opcionalmente targets registrados en código. */
function validarCoachManifest(opts) {
    const registered = new Set(opts?.registeredTargetIds ?? []);
    const pathname = opts?.pathname ?? '/mesas';
    const issues = [];
    const manifestTargetIds = new Set(help_manifest_1.HELP_MANIFEST_TARGETS.map((t) => t.id));
    const manifestScreenIds = new Set(help_manifest_1.HELP_MANIFEST_SCREENS.map((s) => s.id));
    const knownSignals = new Set();
    for (const s of help_manifest_1.HELP_MANIFEST_SCREENS) {
        knownSignals.add(s.signalOnEnter);
    }
    knownSignals.add('help.ayuda_visible');
    knownSignals.add('help.hub_abierto');
    knownSignals.add('help.coach_activo');
    knownSignals.add('nav.mas_abierto');
    knownSignals.add('mesa.tiene_pedido');
    knownSignals.add('mesa.tiene_lineas');
    knownSignals.add('mesa.mesas_agrupadas');
    knownSignals.add('pedido.agrego_item');
    knownSignals.add('pedido.modo_varios');
    knownSignals.add('pedido.categoria_ok');
    knownSignals.add('pedido.lineas_pendientes_cocina');
    knownSignals.add('pedido.platos_en_cocina');
    knownSignals.add('inventario.tiene_items');
    let stepCount = 0;
    const guides = allGuideIds();
    for (const { id: guideId, rol } of guides) {
        const steps = collectStepsFromGuide(guideId, pathname, rol);
        stepCount += steps.length;
        steps.forEach((step, stepIndex) => {
            if (step.pantalla && !manifestScreenIds.has(step.pantalla) && step.pantalla !== 'help_hub' && step.pantalla !== 'nav_mas_abierto' && step.pantalla !== 'general') {
                issues.push({
                    kind: 'orphan_screen',
                    severity: 'error',
                    guideId,
                    stepIndex,
                    stepTitle: step.title,
                    message: `Pantalla «${step.pantalla}» no existe en el manifest.`,
                    suggestion: 'Agrega la pantalla a HELP_MANIFEST_SCREENS o corrige step.pantalla.',
                });
            }
            if (step.target) {
                const expanded = (0, help_manifest_1.expandirTargetManifest)(step.target);
                const allKnown = expanded.every((tid) => manifestTargetIds.has(tid) || tid === step.target);
                if (!allKnown && !manifestTargetIds.has(step.target)) {
                    issues.push({
                        kind: 'orphan_target',
                        severity: 'error',
                        guideId,
                        stepIndex,
                        stepTitle: step.title,
                        message: `Target «${step.target}» no está en HELP_MANIFEST_TARGETS.`,
                        suggestion: 'Registra el target en el manifest y envuelve el UI con <HelpTarget id="…">.',
                    });
                }
                if (registered.size > 0) {
                    const anyRegistered = expanded.some((tid) => registered.has(tid));
                    if (!anyRegistered) {
                        issues.push({
                            kind: 'missing_target_registration',
                            severity: 'warning',
                            guideId,
                            stepIndex,
                            stepTitle: step.title,
                            message: `Target «${step.target}» no aparece registrado en el código escaneado (${expanded.join(' | ')}).`,
                            suggestion: 'Añade HelpTarget en el componente o actualiza el escaneo coach:discover.',
                        });
                    }
                }
            }
            if (step.listoSi) {
                for (const sig of signalsFromListoSi(step.listoSi)) {
                    if (!knownSignals.has(sig)) {
                        issues.push({
                            kind: 'orphan_signal',
                            severity: 'warning',
                            guideId,
                            stepIndex,
                            stepTitle: step.title,
                            message: `Señal «${sig}» no está documentada en manifest/señales conocidas.`,
                            suggestion: 'Publica la señal con useHelpProgress o añádela al manifest.',
                        });
                    }
                }
            }
            if (!step.listoSi && !step.confirmarEntendido && !step.target) {
                issues.push({
                    kind: 'step_without_completion',
                    severity: 'info',
                    guideId,
                    stepIndex,
                    stepTitle: step.title,
                    message: 'Paso sin target, listoSi ni confirmarEntendido — solo informativo.',
                    suggestion: 'Considera añadir listoSi o confirmarEntendido para avance automático.',
                });
            }
        });
    }
    for (const screen of help_manifest_1.HELP_MANIFEST_SCREENS) {
        if (!(0, help_manifest_1.screenSignalManifest)(screen.id)) {
            issues.push({
                kind: 'screen_without_signal',
                severity: 'error',
                message: `Pantalla «${screen.id}» sin signalOnEnter.`,
            });
        }
    }
    const unregisteredTargetIds = help_manifest_1.HELP_MANIFEST_TARGETS.map((t) => t.id).filter((id) => registered.size > 0 && !registered.has(id));
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    return {
        ok: errorCount === 0,
        errorCount,
        warningCount,
        issues,
        stats: {
            guides: guides.length,
            steps: stepCount,
            targetsInManifest: help_manifest_1.HELP_MANIFEST_TARGETS.length,
            screensInManifest: help_manifest_1.HELP_MANIFEST_SCREENS.length,
            registeredTargetIds: [...registered],
            unregisteredTargetIds,
        },
    };
}
function formatearReporteCoach(report) {
    const lines = [
        `Coach validation: ${report.ok ? 'OK' : 'FAILED'} (${report.errorCount} errors, ${report.warningCount} warnings)`,
        `Guides: ${report.stats.guides} · Steps: ${report.stats.steps} · Manifest targets: ${report.stats.targetsInManifest}`,
        '',
    ];
    for (const issue of report.issues) {
        const loc = issue.guideId
            ? `[${issue.severity}] ${issue.guideId}${issue.stepIndex != null ? `#${issue.stepIndex + 1}` : ''} ${issue.stepTitle ?? ''}`
            : `[${issue.severity}]`;
        lines.push(`${loc}`);
        lines.push(`  ${issue.message}`);
        if (issue.suggestion)
            lines.push(`  → ${issue.suggestion}`);
        lines.push('');
    }
    if (report.stats.unregisteredTargetIds.length > 0) {
        lines.push(`Targets en manifest sin registro en código (${report.stats.unregisteredTargetIds.length}):`);
        lines.push(report.stats.unregisteredTargetIds.join(', '));
    }
    return lines.join('\n');
}
