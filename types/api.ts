export interface ApiFieldErrors {
  [field: string]: string[];
}


export interface ApiFailureEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: ApiFieldErrors;
  };
}

export interface ApiErrorShape {
  status: number;
  code: string;
  message: string;
  fieldErrors?: ApiFieldErrors;
}

export function isApiErrorShape(value: unknown): value is ApiErrorShape {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ApiErrorShape>;

  return (
    typeof candidate.status === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}
