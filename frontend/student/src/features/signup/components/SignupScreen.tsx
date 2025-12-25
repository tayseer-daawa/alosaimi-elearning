import { Box, Button, Flex, Image, Input, InputProps, Text, VStack } from '@chakra-ui/react';
import { useSignupWizard } from '../hooks/useSignupWizard';

import { YesNoToggle } from './YesNoToggle';

const CustomVStackInput = ({
  label,
  state,
  stateSetter,
  handleKeyDownEnter,
  error,
  ...props //input props
}: {
  label: string;
  state: string;
  stateSetter: (value: string) => void;
  handleKeyDownEnter?: (e: React.KeyboardEvent) => void;
  error?: string | null;
} & Omit<InputProps, 'value' | 'onChange'>) => {
  return (
    <VStack gap={{ base: 3, md: 4 }} align="stretch">
      <Text fontSize={{ base: 'sm', md: '2xl', lg: '3xl' }} fontWeight="500" color="text.default">
        {label}
      </Text>
      <Input
        size={{ base: 'md', lg: 'lg' }}
        fontSize={{ base: 'xl', md: '5xl', lg: '5xl' }}
        fontWeight={600}
        variant="flushed"
        onChange={(e) => stateSetter(e.target.value)}
        onKeyDown={handleKeyDownEnter}
        placeholder=""
        borderBottomWidth={{ base: '2px', md: '3px', lg: '4px' }}
        _focus={{ borderColor: 'brand.primary', borderBottomWidth: '3px' }}
        height={{ base: '3.25rem', md: 32, lg: 24 }}
        {...props}
      />
      <ErrorText error={error} />
    </VStack>
  );
};

export default function SignupScreen() {
  const {
    step,
    title,
    error,
    isSubmitting,
    fullName,
    setFullName,
    email,
    setEmail,
    wantsNotifications,
    setWantsNotifications,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    next,
  } = useSignupWizard();

  const handleKeyDownEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    next();
  };

  return (
    <Box
      dir="rtl"
      h="100vh"
      p={{ base: 'calc(5rem + 3vh) 2.5rem calc(3rem + 1vh)', md: 16, lg: 20 }} //Magic numbers are calculated from figma to fit different mobile heights
    >
      <Box p={0} h="100%" display="flex" alignItems="center" justifyContent="center">
        <Flex
          h="100%"
          direction="column"
          gap="auto"
          justifyContent={'space-between'}
          w={{ base: '100%', md: '80%', lg: '60%' }}
        >
          <VStack gap={{ base: 2, md: 3 }} pt={{ base: 4, md: 10, lg: 12 }}>
            <Text
              fontSize={{ base: '3xl', md: '5xl', lg: '5xl' }}
              fontWeight={400}
              textAlign="center"
              lineHeight={{ base: 'short', md: 'shorter' }}
            >
              {title}
            </Text>
          </VStack>

          {step === 'welcome' ? (
            <Image src="/assets/mecque.svg" alt="Mecque illustration" />
          ) : (
            <VStack gap={{ base: 8, md: 10, lg: 12 }} flex="1" justify="center">
              {step === 'name' && (
                <CustomVStackInput
                  label="الاسم الكامل"
                  state={fullName}
                  stateSetter={setFullName}
                  autoComplete="name"
                  handleKeyDownEnter={handleKeyDownEnter}
                  error={error}
                />
              )}

              {step === 'email' && (
                <CustomVStackInput
                  label="البريد الإلكتروني"
                  state={email}
                  stateSetter={setEmail}
                  autoComplete="email"
                  type="email"
                  handleKeyDownEnter={handleKeyDownEnter}
                  error={error}
                />
              )}

              {step === 'goal' && (
                <VStack
                  w={{ base: '100%', md: '75%', lg: '65%' }}
                  gap={{ base: 3, md: 4 }}
                  align="stretch"
                >
                  <Text fontSize={{ base: 'sm', md: '2xl', lg: '3xl' }} color="text.default">
                    هل تريد تلقي بعض الاشعارات على البريد الالكتروني؟
                  </Text>
                  <YesNoToggle value={wantsNotifications} onChange={setWantsNotifications} />

                  <ErrorText error={error} />
                </VStack>
              )}

              {step === 'password' && (
                <VStack w="100%" gap={{ base: 6, md: 8 }} align="center">
                  <CustomVStackInput
                    label="كلمة السر"
                    state={password}
                    stateSetter={setPassword}
                    type="password"
                    autoComplete="new-password"
                    handleKeyDownEnter={handleKeyDownEnter}
                  />
                  <CustomVStackInput
                    label="تأكيد كلمة السر"
                    state={confirmPassword}
                    stateSetter={setConfirmPassword}
                    type="password"
                    autoComplete="new-password"
                    handleKeyDownEnter={handleKeyDownEnter}
                    error={error}
                  />
                </VStack>
              )}
            </VStack>
          )}

          <Button
            size={{ base: 'md', md: 'lg' }}
            w={{ base: '80%', md: '60%', lg: '50%' }}
            alignSelf="center"
            onClick={next}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {step === 'welcome' ? 'دخول' : 'مواصلة'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}

const ErrorText = ({ error }: { error?: string | null }) => {
  return error ? (
    <Text
      fontSize={{ base: 'md', md: '2xl', lg: '3xl' }}
      color="red.500"
      textAlign="start"
      w="100%"
    >
      {error}
    </Text>
  ) : null;
};
