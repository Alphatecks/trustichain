import { getApiUrl } from './config';

const LOG_PREFIX = '[TrustiChain Supplier ID]';

export const parseMySupplierId = (result) => {
  if (!result) return '';

  const data = result.data ?? result;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (typeof data !== 'object' || data === null) {
    return '';
  }

  const candidates = [
    data.globalSupplierId,
    data.global_supplier_id,
    data.supplierId,
    data.supplier_id,
    data.mySupplierId,
    data.my_supplier_id,
    data.businessSupplierId,
    data.businessId,
    data.id,
  ];

  const found = candidates.find((value) => typeof value === 'string' && value.trim());
  return found ? found.trim() : '';
};

export async function fetchMySupplierIdDetail(token) {
  const url = getApiUrl('api/business-suite/my-supplier-id');

  if (!token) {
    console.warn(`${LOG_PREFIX} Skipped — missing auth token`);
    return {
      url,
      ok: false,
      status: 0,
      result: null,
      supplierId: '',
      error: 'missing_token',
    };
  }

  console.warn(`${LOG_PREFIX} GET ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json().catch(() => ({}));
    const supplierId = response.ok ? parseMySupplierId(result) : '';

    console.warn(`${LOG_PREFIX} Response`, {
      url,
      ok: response.ok,
      status: response.status,
      result,
      supplierId: supplierId || '(empty)',
    });

    return {
      url,
      ok: response.ok,
      status: response.status,
      result,
      supplierId,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Request failed`, error);
    return {
      url,
      ok: false,
      status: 0,
      result: null,
      supplierId: '',
      error: error?.message || 'request_failed',
    };
  }
}

export async function fetchMySupplierId(token) {
  const detail = await fetchMySupplierIdDetail(token);
  return detail.supplierId;
}
