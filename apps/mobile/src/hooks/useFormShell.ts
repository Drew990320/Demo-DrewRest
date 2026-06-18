import { useMemo } from 'react';
import { type FormShellVariant, formShellStyle } from '../lib/form-layout';
import { useResponsive } from './useResponsive';

export function useFormShell(variant: FormShellVariant = 'page') {
  const r = useResponsive();
  return useMemo(
    () => formShellStyle(r.width, r.contentMaxWidth, variant),
    [r.width, r.contentMaxWidth, variant],
  );
}
