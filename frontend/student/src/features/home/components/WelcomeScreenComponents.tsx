import {
    Box,
    Flex,
    Heading,
    Button,
    Image,
    Text,
    VStack,
    HStack,
    Icon,
    Badge
} from "@chakra-ui/react";

import MenuIcon from "/assets/menu.svg";
import { BookOpen, GraduationCap, MoveLeft } from "lucide-react";


interface Lesson {
    id: number;
    title: string;
    subtitle: string;
    status?: string;
    description?: string;
    progress: number;
    isActive: boolean;
}

interface WelcomeScreenProps {
    currentLesson?: Lesson;
    allLessons?: Lesson[];
    userName?: string;
    onContinueLearning?: () => void;
    onViewAllPrograms?: () => void;
}

export default function WelcomeScreenComponents({
    currentLesson,
    allLessons = [],
    userName = "الطالب",
    onContinueLearning,
    onViewAllPrograms
}: WelcomeScreenProps) {

    // Get active lesson or first lesson with progress
    const activeLesson = currentLesson || allLessons.find(l => l.isActive) || allLessons[0];

    // Calculate total programs and completed
    const totalPrograms = allLessons.length;
    const programsInProgress = allLessons.filter(l => l.progress > 0).length;

    return (
        <Box minH="100vh" display="flex" flexDirection="column" py={4} px={6} dir="rtl">
            {/* Header */}
            <Box
                position="relative"
                h={{ base: "auto", lg: "100px" }}
                w="full"
                mt={{ base: 3, lg: 5 }}
                mb={{ base: 8, lg: 10 }}
            >
                <Flex align="center" justify="center" h="100%">
                    <Button
                        position="absolute"
                        right={{ base: 0, lg: 14 }}
                        variant="ghost"
                        p={2}
                    >
                        <Image
                            src={MenuIcon}
                            boxSize={{ base: 6, lg: 12 }}
                            objectFit="contain"
                        />
                    </Button>

                    <VStack gap={{ base: 1, lg: 2 }}>
                        <Heading
                            size={{ base: "xl", lg: "5xl" }}
                            color="brand.primary"
                        >
                            مرحباً {userName}
                        </Heading>
                        <Text
                            fontSize={{ base: "sm", lg: "xl" }}
                            color="brand.secondary"
                            fontWeight="400"
                        >
                            لنواصل رحلة التعلم معاً
                        </Text>
                    </VStack>
                </Flex>
            </Box>

            {/* Main Content */}
            <Flex
                direction={{ base: "column", lg: "row" }}
                gap={{ base: 6, lg: 10 }}
                flex={1}
                maxW="1600px"
                mx="auto"
                w="full"
                pb={{ base: 6, lg: 0 }}
            >
                {/* Current Program Card */}
                <Box
                    flex={{ base: "1", lg: "1.3" }}
                    bg="white"
                    borderRadius={{ base: "2xl", lg: "3xl" }}
                    boxShadow="0 4px 20px rgba(33, 96, 93, 0.08)"
                    overflow="hidden"
                    transition="all 0.3s ease"
                    _hover={{
                        transform: "translateY(-6px)",
                        boxShadow: "0 12px 32px rgba(33, 96, 93, 0.15)",
                    }}
                    cursor="pointer"
                    onClick={onContinueLearning}
                    p={{ base: 6, lg: 10 }}
                >
                    <VStack align="stretch" gap={{ base: 6, lg: 8 }} h="full">
                        {/* Card Header */}
                        <Flex justify="space-between" align="flex-start" gap={4}>
                            <VStack align="start" gap={{ base: 2, lg: 3 }} flex={1}>
                                <HStack gap={2}>
                                    <Text
                                        fontSize={{ base: "sm", lg: "lg" }}
                                        color="brand.secondary"
                                        fontWeight="600"
                                        letterSpacing="0.5px"
                                    >
                                        البرنامج الحالي
                                    </Text>
                                    {activeLesson?.status && (
                                        <Badge
                                            bg="brand.accent"
                                            color="brand.primary"
                                            px={3}
                                            py={1}
                                            borderRadius="full"
                                            fontSize={{ base: "xs", lg: "sm" }}
                                            fontWeight="500"
                                        >
                                            {activeLesson.status}
                                        </Badge>
                                    )}
                                </HStack>

                                <Heading
                                    size={{ base: "xl", lg: "3xl" }}
                                    color="brand.primary"
                                    lineHeight="1.2"
                                    fontWeight="700"
                                >
                                    {activeLesson?.title || "لا يوجد برنامج نشط"}
                                </Heading>

                                {activeLesson?.subtitle && (
                                    <Text
                                        fontSize={{ base: "md", lg: "xl" }}
                                        color="brand.secondary"
                                        fontWeight="500"
                                    >
                                        {activeLesson.subtitle}
                                    </Text>
                                )}

                                {activeLesson?.description && (
                                    <Text
                                        fontSize={{ base: "sm", lg: "lg" }}
                                        color="brand.gray"
                                        lineHeight="1.7"
                                        mt={{ base: 2, lg: 3 }}
                                    >
                                        {activeLesson.description}
                                    </Text>
                                )}
                            </VStack>

                            <Flex
                                bg="brand.lightTeal"
                                p={{ base: 3, lg: 4 }}
                                borderRadius="xl"
                                align="center"
                                justify="center"
                                flexShrink={0}
                            >
                                <Icon
                                    as={BookOpen}
                                    boxSize={{ base: 6, lg: 10 }}
                                    color="brand.primary"
                                />
                            </Flex>
                        </Flex>

                        {/* Progress Section */}
                        {activeLesson && (
                            <Box
                                bg="brand.lightTeal"
                                borderRadius="xl"
                                p={{ base: 5, lg: 7 }}
                                mt="auto"
                            >
                                <VStack align="stretch" gap={{ base: 3, lg: 4 }}>
                                    <Flex justify="space-between" align="center">
                                        <Text
                                            fontSize={{ base: "sm", lg: "lg" }}
                                            color="brand.primary"
                                            fontWeight="600"
                                        >
                                            نسبة الإنجاز
                                        </Text>
                                        <Text
                                            fontSize={{ base: "2xl", lg: "4xl" }}
                                            fontWeight="700"
                                            color="brand.primary"
                                        >
                                            {activeLesson.progress}%
                                        </Text>
                                    </Flex>

                                    <Box
                                        w="full"
                                        h={{ base: "10px", lg: "14px" }}
                                        bg="white"
                                        borderRadius="full"
                                        overflow="hidden"
                                        boxShadow="inset 0 2px 4px rgba(0,0,0,0.06)"
                                    >
                                        <Box
                                            h="full"
                                            w={`${activeLesson.progress}%`}
                                            bg="brand.secondary"
                                            transition="width 0.6s ease"
                                            borderRadius="full"
                                            position="relative"
                                            _after={{
                                                content: '""',
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                                                animation: activeLesson.progress > 0 ? "shimmer 2s infinite" : "none",
                                            }}

                                        />
                                    </Box>
                                </VStack>
                            </Box>
                        )}

                        {/* Action Button */}
                        <Button
                            size={{ base: "md", lg: "lg" }}
                            w="full"
                            onClick={(e) => {
                                e.stopPropagation();
                                onContinueLearning?.();
                            }}
                        >
                            <Flex align="center" gap={3}>
                                <Text fontSize={{ base: "lg", lg: "2xl" }}>متابعة التعلم</Text>
                                <Icon as={MoveLeft} boxSize={{ base: 5, lg: 7 }} />
                            </Flex>
                        </Button>
                    </VStack>
                </Box>

                {/* All Programs Card */}
                <Box
                    flex={{ base: "1", lg: "0.9" }}
                    bg="linear-gradient(135deg, #21605D 0%, #2D836E 100%)"
                    borderRadius={{ base: "2xl", lg: "3xl" }}
                    boxShadow="0 4px 20px rgba(33, 96, 93, 0.25)"
                    overflow="hidden"
                    position="relative"
                    transition="all 0.3s ease"
                    _hover={{
                        transform: "translateY(-6px)",
                        boxShadow: "0 12px 32px rgba(33, 96, 93, 0.35)",
                    }}
                    cursor="pointer"
                    onClick={onViewAllPrograms}
                    p={{ base: 6, lg: 10 }}
                    _before={{
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "radial-gradient(circle at top right, rgba(228, 219, 153, 0.15), transparent 60%)",
                        pointerEvents: "none",
                    }}
                >
                    <VStack align="stretch" gap={{ base: 6, lg: 8 }} h="full" position="relative" zIndex={1}>
                        {/* Icon */}
                        <Flex justify="center" mt={{ base: 2, lg: 6 }}>
                            <Flex
                                bg="rgba(255, 255, 255, 0.12)"
                                p={{ base: 6, lg: 9 }}
                                borderRadius="3xl"
                                backdropFilter="blur(12px)"
                                border="1px solid rgba(255, 255, 255, 0.18)"
                                boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
                                align="center"
                                justify="center"
                            >
                                <Icon
                                    as={GraduationCap}
                                    boxSize={{ base: 12, lg: 20 }}
                                    color="white"
                                />
                            </Flex>
                        </Flex>

                        {/* Content */}
                        <VStack align="stretch" gap={{ base: 3, lg: 4 }} flex={1}>
                            <Heading
                                size={{ base: "xl", lg: "3xl" }}
                                color="white"
                                textAlign="center"
                                lineHeight="1.3"
                                fontWeight="700"
                            >
                                استكشف جميع البرامج
                            </Heading>
                            <Text
                                fontSize={{ base: "sm", lg: "lg" }}
                                color="rgba(255, 255, 255, 0.95)"
                                textAlign="center"
                                lineHeight="1.8"
                                fontWeight="400"
                            >
                                اطلع على مجموعة شاملة من البرامج التعليمية المتنوعة والمصممة خصيصاً لتطوير مهاراتك
                            </Text>
                        </VStack>

                        {/* Stats Grid */}
                        <Flex
                            gap={{ base: 3, lg: 5 }}
                            justify="center"
                            flexWrap="wrap"
                            mt="auto"
                        >
                            <Box
                                bg="rgba(255, 255, 255, 0.15)"
                                backdropFilter="blur(12px)"
                                border="1px solid rgba(255, 255, 255, 0.2)"
                                px={{ base: 5, lg: 8 }}
                                py={{ base: 3, lg: 5 }}
                                borderRadius="xl"
                                textAlign="center"
                                minW={{ base: "120px", lg: "160px" }}
                                transition="all 0.3s"
                                _hover={{
                                    bg: "rgba(255, 255, 255, 0.22)",
                                    transform: "scale(1.05)",
                                }}
                            >
                                <Text fontSize={{ base: "3xl", lg: "5xl" }} fontWeight="700" color="white" lineHeight="1">
                                    {totalPrograms}
                                </Text>
                                <Text fontSize={{ base: "xs", lg: "md" }} color="rgba(255, 255, 255, 0.95)" mt={2} fontWeight="500">
                                    برنامج متاح
                                </Text>
                            </Box>

                            <Box
                                bg="rgba(228, 219, 153, 0.25)"
                                backdropFilter="blur(12px)"
                                border="1px solid rgba(228, 219, 153, 0.3)"
                                px={{ base: 5, lg: 8 }}
                                py={{ base: 3, lg: 5 }}
                                borderRadius="xl"
                                textAlign="center"
                                minW={{ base: "120px", lg: "160px" }}
                                transition="all 0.3s"
                                _hover={{
                                    bg: "rgba(228, 219, 153, 0.35)",
                                    transform: "scale(1.05)",
                                }}
                            >
                                <Text fontSize={{ base: "3xl", lg: "5xl" }} fontWeight="700" color="white" lineHeight="1">
                                    {programsInProgress}
                                </Text>
                                <Text fontSize={{ base: "xs", lg: "md" }} color="rgba(255, 255, 255, 0.95)" mt={2} fontWeight="500">
                                    قيد الدراسة
                                </Text>
                            </Box>
                        </Flex>

                        {/* Button */}
                        <Button
                            bg={'brand.accent'}
                            color={'brand.primary'}
                            size={{ base: "md", lg: "lg" }}
                            w="full"
                            mt={{ base: 4, lg: 6 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewAllPrograms?.();
                            }}
                            _hover={{
                                transform: "translateY(-2px)",
                                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                            }}
                        >
                            <Flex align="center" gap={3}>
                                <Text fontSize={{ base: "lg", lg: "2xl" }}>عرض جميع البرامج</Text>
                                <Icon as={MoveLeft} boxSize={{ base: 5, lg: 7 }} />
                            </Flex>
                        </Button>
                    </VStack>
                </Box>
            </Flex>
        </Box>
    );
}
