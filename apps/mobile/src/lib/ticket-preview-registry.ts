export type TicketPreviewOptions = {
  titulo?: string;
};

type ShowTicketPreviewHandler = (
  html: string,
  opts?: TicketPreviewOptions,
) => Promise<void>;

let showTicketPreviewHandler: ShowTicketPreviewHandler | null = null;

export function registerTicketPreviewHandler(handler: ShowTicketPreviewHandler) {
  showTicketPreviewHandler = handler;
}

export function unregisterTicketPreviewHandler() {
  showTicketPreviewHandler = null;
}

export function showTicketPreview(
  html: string,
  opts?: TicketPreviewOptions,
): Promise<void> {
  if (showTicketPreviewHandler) {
    return showTicketPreviewHandler(html, opts);
  }
  return Promise.resolve();
}
