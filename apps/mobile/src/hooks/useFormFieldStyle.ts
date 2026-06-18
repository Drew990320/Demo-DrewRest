import { useMemo } from 'react';
import { type FormFieldKind, formFieldStyle } from '../lib/form-layout';
import { useResponsive } from './useResponsive';

export function useFormFieldStyle(kind: FormFieldKind = 'text') {
  const { width } = useResponsive();
  return useMemo(() => formFieldStyle(width, kind), [width, kind]);
}
