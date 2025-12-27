import { createFileRoute } from '@tanstack/react-router';

import SignupScreen from '@/features/signup/components/SignupScreen';
export const Route = createFileRoute('/_layout/signup')({
  component: SignupScreen,
});
