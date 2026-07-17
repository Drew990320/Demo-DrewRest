"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluarPreparacionPasoCoach = evaluarPreparacionPasoCoach;
exports.layoutEnViewport = layoutEnViewport;
const help_manifest_1 = require("./help-manifest");
const help_coach_1 = require("./help-coach");
function sugerenciaParaBloqueo(reason, meta) {
    switch (reason) {
        case 'not_registered':
            return meta
                ? `El elemento «${meta.label}» aún no está en pantalla. Completa el paso anterior o navega a la sección correcta.`
                : 'El elemento de este paso aún no está en pantalla.';
        case 'not_visible':
            return meta
                ? `«${meta.label}» existe pero no es visible. Espera a que termine de cargar la pantalla.`
                : 'El elemento existe pero no es visible todavía.';
        case 'disabled':
            return meta
                ? `«${meta.label}» está deshabilitado. Revisa permisos o completa la acción previa (ej. agregar ítems antes de «Pasar a cocina»).`
                : 'El botón está deshabilitado. Revisa permisos o el estado del pedido.';
        case 'off_viewport':
            return 'Desplazando la vista hacia el elemento…';
        case 'wrong_screen':
            return 'Primero ve a la pantalla indicada con «Ir a pantalla».';
        case 'needs_navigation':
            return 'Usa «Ir a pantalla» para continuar el recorrido.';
        case 'needs_hub':
            return 'Abre el menú de ayuda para este paso.';
        case 'needs_more_menu':
            return 'Abre «Más» en la navegación y elige la opción del paso.';
        case 'waiting_load':
            return 'Esperando a que la pantalla termine de cargar…';
        case 'educational_only':
            return 'Lee el paso y pulsa «Entendido» para continuar.';
        case 'no_target':
            return null;
        default:
            return null;
    }
}
/** Evalúa si el paso puede resaltarse / interactuarse según manifest + estado runtime. */
function evaluarPreparacionPasoCoach(input) {
    const { step, currentScreenId, view, signals, targetRuntime } = input;
    if (step.confirmarEntendido && !step.target) {
        return {
            targetId: null,
            targetMeta: null,
            canHighlight: false,
            canInteract: false,
            shouldScroll: false,
            blockedReason: 'educational_only',
            suggestion: sugerenciaParaBloqueo('educational_only', null),
        };
    }
    if (step.pantalla === 'help_hub' && view !== 'hub') {
        return {
            targetId: null,
            targetMeta: null,
            canHighlight: false,
            canInteract: false,
            shouldScroll: false,
            blockedReason: 'needs_hub',
            suggestion: sugerenciaParaBloqueo('needs_hub', null),
        };
    }
    if (step.pantalla &&
        step.pantalla !== 'help_hub' &&
        step.pantalla !== 'nav_mas_abierto' &&
        currentScreenId &&
        currentScreenId !== step.pantalla &&
        !step.target?.startsWith('nav.') &&
        !step.target?.startsWith('more.')) {
        const esperada = (0, help_manifest_1.screenSignalManifest)(step.pantalla);
        const enPantalla = esperada ? Boolean(signals[esperada]) : false;
        if (!enPantalla && step.irARuta) {
            return {
                targetId: null,
                targetMeta: null,
                canHighlight: false,
                canInteract: false,
                shouldScroll: false,
                blockedReason: 'needs_navigation',
                suggestion: sugerenciaParaBloqueo('needs_navigation', null),
            };
        }
    }
    if (step.pantalla === 'nav_mas_abierto' && !signals['nav.mas_abierto']) {
        return {
            targetId: step.target ?? 'nav.mas',
            targetMeta: (0, help_manifest_1.manifestTarget)(step.target ?? 'nav.mas') ?? null,
            canHighlight: false,
            canInteract: false,
            shouldScroll: false,
            blockedReason: 'needs_more_menu',
            suggestion: sugerenciaParaBloqueo('needs_more_menu', (0, help_manifest_1.manifestTarget)('nav.mas') ?? null),
        };
    }
    const targetId = (0, help_coach_1.resolverTargetCoachPaso)(step, signals);
    if (!targetId) {
        return {
            targetId: null,
            targetMeta: null,
            canHighlight: false,
            canInteract: false,
            shouldScroll: false,
            blockedReason: 'no_target',
            suggestion: null,
        };
    }
    const targetMeta = (0, help_manifest_1.manifestTarget)(targetId) ?? null;
    const expanded = (0, help_manifest_1.expandirTargetManifest)(targetId);
    const metaForSuggestion = targetMeta ?? (0, help_manifest_1.manifestTarget)(expanded[0] ?? targetId) ?? null;
    if (targetMeta?.screenIds?.length &&
        currentScreenId &&
        !targetMeta.screenIds.includes(currentScreenId) &&
        !targetId.startsWith('nav.') &&
        !targetId.startsWith('more.')) {
        return {
            targetId,
            targetMeta,
            canHighlight: false,
            canInteract: false,
            shouldScroll: false,
            blockedReason: 'wrong_screen',
            suggestion: sugerenciaParaBloqueo('wrong_screen', metaForSuggestion),
        };
    }
    if (!targetRuntime) {
        return {
            targetId,
            targetMeta,
            canHighlight: false,
            canInteract: false,
            shouldScroll: Boolean(metaForSuggestion?.scrollIntoView),
            blockedReason: 'not_registered',
            suggestion: sugerenciaParaBloqueo('not_registered', metaForSuggestion),
        };
    }
    if (!targetRuntime.registered) {
        return {
            targetId,
            targetMeta,
            canHighlight: false,
            canInteract: false,
            shouldScroll: Boolean(metaForSuggestion?.scrollIntoView),
            blockedReason: 'not_registered',
            suggestion: sugerenciaParaBloqueo('not_registered', metaForSuggestion),
        };
    }
    if (!targetRuntime.visible) {
        return {
            targetId,
            targetMeta,
            canHighlight: false,
            canInteract: false,
            shouldScroll: Boolean(metaForSuggestion?.scrollIntoView),
            blockedReason: 'not_visible',
            suggestion: sugerenciaParaBloqueo('not_visible', metaForSuggestion),
        };
    }
    if (!targetRuntime.enabled) {
        return {
            targetId,
            targetMeta,
            canHighlight: true,
            canInteract: false,
            shouldScroll: false,
            blockedReason: 'disabled',
            suggestion: sugerenciaParaBloqueo('disabled', metaForSuggestion),
        };
    }
    if (!targetRuntime.inViewport) {
        return {
            targetId,
            targetMeta,
            canHighlight: false,
            canInteract: false,
            shouldScroll: true,
            blockedReason: 'off_viewport',
            suggestion: sugerenciaParaBloqueo('off_viewport', metaForSuggestion),
        };
    }
    return {
        targetId,
        targetMeta,
        canHighlight: true,
        canInteract: true,
        shouldScroll: false,
        blockedReason: null,
        suggestion: null,
    };
}
/** ¿El rect está dentro del viewport con margen? */
function layoutEnViewport(layout, viewportW, viewportH, margin = 8) {
    return (layout.x + layout.width > margin &&
        layout.y + layout.height > margin &&
        layout.x < viewportW - margin &&
        layout.y < viewportH - margin);
}
