import type { HelpKnowledgeTopic } from './help-manifest';
import type { HelpRol } from './help-tutorials';
/**
 * Base de conocimiento del Coach — consultable por módulo, pantalla o FAQ.
 * Extensible: cada feature nueva añade un topic aquí (o lo genera el manifest en el futuro).
 */
export declare const HELP_KNOWLEDGE_TOPICS: HelpKnowledgeTopic[];
export declare function conocimientoPorModulo(moduleId: string, rol: HelpRol): HelpKnowledgeTopic[];
export declare function conocimientoPorPantalla(screenId: string, rol: HelpRol): HelpKnowledgeTopic[];
export declare function buscarConocimiento(query: string, rol: HelpRol): HelpKnowledgeTopic[];
