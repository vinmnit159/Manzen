import { redirect } from 'react-router';
import { hasAuthToken } from '@/services/authStorage';

export function requireAuth() {
  if (!hasAuthToken()) {
    return redirect('/login');
  }

  return null;
}
