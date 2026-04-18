type ServiceName = 'doctor' | 'patient' | 'appointment' | 'telemedicine';

const LOCAL_DEFAULTS: Record<ServiceName, string> = {
  doctor: 'http://localhost:3002/api/v1',
  patient: 'http://localhost:3005/api/v1',
  appointment: 'http://localhost:3004/api/v1',
  telemedicine: 'http://localhost:8090/api/v1',
};

function pickFirstDefined(values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeApiBase(rawBaseUrl: string): string {
  const normalized = rawBaseUrl.replace(/\/+$/, '');
  const apiV1Marker = '/api/v1';
  const apiV1Index = normalized.indexOf(apiV1Marker);
  if (apiV1Index >= 0) {
    return normalized.slice(0, apiV1Index + apiV1Marker.length);
  }
  if (normalized.endsWith('/api')) {
    return `${normalized}/v1`;
  }
  return `${normalized}/api/v1`;
}

export function resolveServiceApiBase(service: ServiceName): string {
  const candidate =
    service === 'doctor'
      ? pickFirstDefined([
          process.env.INTERNAL_DOCTOR_API,
          process.env.DOCTOR_SERVICE_URL,
        ])
      : service === 'patient'
      ? pickFirstDefined([
          process.env.INTERNAL_PATIENT_API,
          process.env.PATIENT_SERVICE_URL,
        ])
      : service === 'appointment'
      ? pickFirstDefined([
          process.env.INTERNAL_APPOINTMENT_API,
          process.env.APPOINTMENT_SERVICE_URL,
        ])
      : pickFirstDefined([
          process.env.INTERNAL_TELEMEDICINE_API,
          process.env.TELEMEDICINE_SERVICE_URL,
        ]);

  return normalizeApiBase(candidate || LOCAL_DEFAULTS[service]);
}

export function resolveServiceOrigin(service: ServiceName): string {
  return resolveServiceApiBase(service).replace(/\/api\/v1$/, '');
}
