import type { HelpTutorialStep } from './help-tutorials';
export type HelpLayoutCanal = 'movil' | 'tablet';
/** Resuelve body/buscar/acción según barra inferior (móvil) o lateral + rail (tablet/PC). */
export declare function resolverTextoPasoCoach(step: HelpTutorialStep, canal: HelpLayoutCanal): Pick<HelpTutorialStep, 'body' | 'buscar' | 'accion'>;
