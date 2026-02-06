import { lessons } from "@/shared/api/mockData";
import { Flex, SimpleGrid } from "@chakra-ui/react";
import { ActiveProgramCard } from "./ActiveProgramCard";
import { ProgramCard } from "./ProgramCard";
import { useNavigate } from "@tanstack/react-router";

export const ProgramsList = () => {
    const navigate = useNavigate()

    const renderCard = (lesson: typeof lessons[0]) => {
        if (lesson.isActive) {
            return (
                <ActiveProgramCard
                    status={lesson.status ?? ""}
                    title={lesson.title}
                    subtitle={lesson.subtitle ?? ""}
                    description={lesson.description ?? ""}
                    progress={lesson.progress}
                    onPlay={() => navigate({
                        to: '/programs/$programId/phases',
                        params: { programId: (lesson.id).toString() },
                    })
                    }
                />
            );
        }

        return (
            <ProgramCard
                title={lesson.title}
                subtitle={lesson.subtitle ?? ""}
                showComingSoon={lesson.status === "قريبًا"}
                onClick={() => console.log(lesson.id)}
            />
        );
    };

    return (
        <SimpleGrid
            flex="1"
            w={'full'}
            columns={{ base: 1, lg: 3 }}
        >
            {lessons.map((lesson, index) => (
                <Flex
                    key={lesson.id}
                    justify={{
                        base: index % 2 !== 0 ? "flex-end" : "flex-start",
                        lg: "center",
                    }}
                >
                    {renderCard(lesson)}
                </Flex>
            ))}
        </SimpleGrid>
    );
};
