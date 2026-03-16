import { QueryClient } from '../../lib/index.ts';

export const exampleQueryClient = new QueryClient({ staleTime: 1000 * 20 });
