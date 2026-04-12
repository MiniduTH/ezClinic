export function getUserRole(user: any | undefined | null): string {
  if (!user) return 'unauthorized';
  
  // Try to extract role array from the custom namespace
  const roles = user['https://ezclinic.com/roles'];
  
  if (Array.isArray(roles) && roles.length > 0) {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('doctor')) return 'doctor';
    if (roles.includes('patient')) return 'patient';
  }
  
  return 'patient'; // Fallback / default
}
