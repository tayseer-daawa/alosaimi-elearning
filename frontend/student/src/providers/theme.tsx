import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { system } from '../theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
