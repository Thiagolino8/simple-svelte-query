import { QueryClient } from '../../index.ts';

export const exampleQueryClient = new QueryClient({ staleTime: 1000 * 20 });
