import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Image,
  Input,
  InputProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useLoginWizard } from '../hooks/useLoginWizard';

import { YesNoToggle } from './YesNoToggle';

const CustomVStackInput = ({
  label,
  state,
  stateSetter,
  ...props //input props
}: {
  label: string;
  state: string;
  stateSetter: (value: string) => void;
} & Omit<InputProps, 'value' | 'onChange'>) => {
  return (
    <VStack w={{ base: '90%', md: '45%', lg: '35%' }} gap={{ base: 3, md: 4 }} align="stretch">
      <Text fontSize={{ base: 'sm', md: '2xl', lg: '3xl' }} color="text.default">
        {label}
      </Text>
      <Input
        size={{ base: 'md', lg: 'xl' }}
        fontSize={{ base: 'xl', md: '2xl', lg: '4xl' }}
        fontWeight={600}
        variant="flushed"
        value={state}
        onChange={(e) => stateSetter(e.target.value)}
        placeholder=""
        borderColor="brand.primary"
        borderBottomWidth={{ base: '2px', md: '3px', lg: '4px' }}
        _focus={{ borderColor: 'brand.primary', borderBottomWidth: '3px' }}
        height={{ base: 16, md: 24, lg: 24 }}
        {...props}
      />
    </VStack>
  );
};

export default function LoginScreen() {
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
  } = useLoginWizard();

  return (
    <Box dir="rtl" minH="100vh" py={{ base: 10, md: 16, lg: 20 }}>
      <Container>
        <Flex minH="calc(100vh - 80px)" direction="column" gap={{ base: 10, md: 12, lg: 14 }}>
          <VStack gap={{ base: 2, md: 3 }} pt={{ base: 4, md: 10, lg: 12 }}>
            <Text
              fontSize={{ base: '2xl', md: '4xl', lg: '5xl' }}
              fontWeight={700}
              textAlign="center"
              lineHeight={{ base: 'short', md: 'shorter' }}
            >
              {title}
            </Text>
          </VStack>

          {step === 'welcome' ? (
            <Image
              src="/assets/mecque.svg"
              alt="Mecque illustration"
              width={{ base: '80%', md: '65%', lg: '60%' }}
              height="100%"
              mx="auto"
              my="auto"
            />
          ) : (
            // </VStack>
            <VStack gap={{ base: 8, md: 10, lg: 12 }} flex="1" justify="center">
              {step === 'name' && (
                <CustomVStackInput
                  label="الاسم الكامل"
                  state={fullName}
                  stateSetter={setFullName}
                  autoComplete="name"
                />
              )}

              {step === 'email' && (
                <CustomVStackInput
                  label="البريد الإلكتروني"
                  state={email}
                  stateSetter={setEmail}
                  autoComplete="email"
                  type="email"
                />
              )}

              {step === 'goal' && (
                <VStack
                  w={{ base: '90%', md: '45%', lg: '35%' }}
                  gap={{ base: 3, md: 4 }}
                  align="stretch"
                >
                  <Text fontSize={{ base: 'sm', md: 'md', lg: 'lg' }} color="text.default">
                    هل تريد تلقي بعض الاشعارات على البريد الالكتروني؟
                  </Text>
                  <YesNoToggle value={wantsNotifications} onChange={setWantsNotifications} />
                 
                 
                  {/* <ErrorText error={error} /> */}
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
                  />
                  <CustomVStackInput
                    label="تأكيد كلمة السر"
                    state={confirmPassword}
                    stateSetter={setConfirmPassword}
                    type="password"
                    autoComplete="new-password"
                  />
                </VStack>
              )}

              {error ? (
                <Text fontSize={{ base: 'sm', md: 'md' }} color="red.500" textAlign="center">
                  {error}
                </Text>
              ) : null}
            </VStack>
          )}

          <Box
            pb={{ base: 6, md: 10, lg: 12 }}
            width={{ base: '80%', md: '45%', lg: '30%' }}
            mx="auto"
          >
            <Button
              size={{ base: 'md', md: '2xl' }}
              fontSize={{ base: 'auto', md: '2xl', lg: '3xl' }}
              w="100%"
              bg="brand.primary"
              color="white"
              _hover={{ bg: 'brand.primary' }}
              onClick={next}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {step === 'welcome' ? 'دخول' : 'مواصلة'}
            </Button>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
