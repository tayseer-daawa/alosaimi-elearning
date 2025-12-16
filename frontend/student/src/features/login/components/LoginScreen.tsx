import { Box, Button, Container, Flex, HStack, Image, Input, Text, VStack } from '@chakra-ui/react';
import { useLoginWizard } from '../hooks/useLoginWizard';

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
    wantsLearning,
    setWantsLearning,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    next,
  } = useLoginWizard();

  return (
    <Box dir="rtl" minH="100vh" py={{ base: 10, md: 14 }}>
      <Container maxW="sm">
        <Flex minH="calc(100vh - 80px)" direction="column" gap={10}>
          <VStack gap={2} pt={{ base: 4, md: 8 }}>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight={700} textAlign="center">
              {title}
            </Text>
          </VStack>

          {step === 'welcome' ? (
            <VStack gap={8} flex="1" justify="center">
              <Image
                src="/assets/mecque.svg"
                alt="Mecque illustration"
                maxW={{ base: '80%', md: '70%' }}
                mx="auto"
              />
            </VStack>
          ) : (
            <VStack gap={8} flex="1" justify="center">
              {step === 'name' && (
                <VStack w="100%" gap={3} align="stretch">
                  <Text fontSize="sm" color="text.default">
                    الاسم الكامل
                  </Text>
                  <Input
                    variant="flushed"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder=""
                    autoComplete="name"
                  />
                </VStack>
              )}

              {step === 'email' && (
                <VStack w="100%" gap={3} align="stretch">
                  <Text fontSize="sm" color="text.default">
                    البريد الإلكتروني
                  </Text>
                  <Input
                    variant="flushed"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    type="email"
                    autoComplete="email"
                  />
                </VStack>
              )}

              {step === 'goal' && (
                <VStack w="100%" gap={5} align="stretch">
                  <Text fontSize="sm" color="text.default">
                    هل تريد تلقي بعض الاشعارات على البريد الالكتروني؟
                  </Text>
                  <HStack gap={3} justify="center">
                    <Button
                      variant={wantsLearning === true ? 'solid' : 'outline'}
                      onClick={() => setWantsLearning(true)}
                      borderColor="brand.primary"
                      color={wantsLearning === true ? 'white' : 'brand.primary'}
                      bg={wantsLearning === true ? 'brand.primary' : 'transparent'}
                      _hover={{ bg: wantsLearning === true ? 'brand.primary' : 'transparent' }}
                      w="40%"
                    >
                      نعم
                    </Button>
                    <Button
                      variant={wantsLearning === false ? 'solid' : 'outline'}
                      onClick={() => setWantsLearning(false)}
                      borderColor="brand.primary"
                      color={wantsLearning === false ? 'white' : 'brand.primary'}
                      bg={wantsLearning === false ? 'brand.primary' : 'transparent'}
                      _hover={{ bg: wantsLearning === false ? 'brand.primary' : 'transparent' }}
                      w="40%"
                    >
                      لا
                    </Button>
                  </HStack>
                </VStack>
              )}

              {step === 'password' && (
                <VStack w="100%" gap={6} align="stretch">
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" color="text.default">
                      كلمة السر
                    </Text>
                    <Input
                      variant="flushed"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                    />
                  </VStack>
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" color="text.default">
                      تأكيد كلمة السر
                    </Text>
                    <Input
                      variant="flushed"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                    />
                  </VStack>
                </VStack>
              )}

              {error ? (
                <Text fontSize="sm" color="red.500" textAlign="center">
                  {error}
                </Text>
              ) : null}
            </VStack>
          )}

          <Box pb={{ base: 6, md: 8 }}>
            <Button
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
