import { useNavigate } from "@tanstack/react-router";
import WelcomeScreenComponents from "./WelcomeScreenComponents";
import { lessons } from "@/shared/api/mockData";


// Example usage component
export default function WelcomeScreen() {
    const navigate = useNavigate();

    const handleContinueLearning = () => {
        // Navigate to the current course detail page
        const activeLesson = lessons.find(l => l.isActive);
        if (activeLesson) {
            navigate({
                to: '/programs/$programId/phases/$phaseId/books/$bookId/courses/$courseId',
                params: {
                    programId: '1',
                    phaseId: '1',
                    bookId: '1',
                    courseId: '1'
                }
            })
        }
    };

    const handleViewAllPrograms = () => {
        // Navigate to the programs list page
        navigate({ to: '/programs' });
    };

    return (
        <WelcomeScreenComponents
            allLessons={lessons}
            userName="أحمد" // You can get this from your auth context or user state
            onContinueLearning={handleContinueLearning}
            onViewAllPrograms={handleViewAllPrograms}
        />
    );
}