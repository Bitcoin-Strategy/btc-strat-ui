import { SUBGRAPH_CONFIG } from './subgraph-config';

export interface SubgraphResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export async function querySubgraph<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const SUBGRAPH_URL = SUBGRAPH_CONFIG.url;

  try {
    console.log('[Subgraph Client] Sending request...');
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const result: SubgraphResponse<T> = await response.json();
    console.log('[Subgraph Client] Response received:', result);

    if (result.errors && result.errors.length > 0) {
      console.error('[Subgraph Client] Query errors:', result.errors);
      throw new Error(`Subgraph query error: ${result.errors[0].message}`);
    }

    if (!result.data) {
      console.error('[Subgraph Client] No data in response');
      throw new Error('No data returned from subgraph');
    }

    console.log(
      '[Subgraph Client] Success! Data keys:',
      Object.keys(result.data),
    );
    return result.data;
  } catch (error) {
    console.error('[Subgraph Client] Query failed with error:', error);
    console.error('[Subgraph Client] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

export async function querySubgraphBatch<T>(
  queries: Array<{ query: string; variables?: Record<string, unknown> }>,
): Promise<T[]> {
  const promises = queries.map((q) => querySubgraph<T>(q.query, q.variables));
  return Promise.all(promises);
}
