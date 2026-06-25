import { toast as sonner } from 'sonner';

const TOAST_STYLES = {
  success: {
    background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.97), rgba(4, 120, 87, 0.97))',
    border: '1px solid #34d399',
    color: '#ecfdf5',
  },
  error: {
    background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.97), rgba(127, 29, 29, 0.97))',
    border: '1px solid #f87171',
    color: '#fef2f2',
  },
  info: {
    background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.97), rgba(29, 78, 216, 0.97))',
    border: '1px solid #60a5fa',
    color: '#eff6ff',
  },
} as const;

/** Show a toast once per id — duplicate calls replace the existing toast instead of stacking. */
function show(
  type: keyof typeof TOAST_STYLES,
  message: string,
  id: string,
): void {
  const options = { id, style: TOAST_STYLES[type] };
  if (type === 'success') sonner.success(message, options);
  else if (type === 'error') sonner.error(message, options);
  else sonner.info(message, options);
}

export const toast = {
  success: (message: string, id = message) => show('success', message, id),
  error: (message: string, id = message) => show('error', message, id),
  info: (message: string, id = message) => show('info', message, id),
};
