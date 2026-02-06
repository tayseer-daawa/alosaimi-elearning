import { Box, Flex, Button, Image, Heading } from '@chakra-ui/react';
import { PhasesList } from './PhasesList';
import MenuIcon from '/assets/menu.svg'
import { Breadcrumbs } from '@/shared/components/BreadcrumbsNavigation';
import { useParams } from '@tanstack/react-router';

export default function PhasesScreen() {
  const { programId } = useParams({ strict: false })

  return (
    <Box minH="100vh" display="flex" flexDirection="column" py={4} px={6} dir="rtl">

      {/* Breadcrumb */}
      <Box
        display={{
          base: 'none',
          lg: 'block'
        }}
        position={'relative'}
        h={{
          lg: '100px'
        }}
        w={'full'}
        mt={5}
        mb={10}
      >

        <Flex align="center" justify="center" h={'100%'} >
          <Button position={'absolute'} right={{
            base: 0,
            lg: 14
          }} variant="ghost" p={2}>
            <Image
              src={MenuIcon}
              boxSize={{ base: 6, lg: 12 }}
              objectFit="contain"
            />
          </Button>

          <Heading size={
            {
              base: 'xl',
              lg: '5xl'
            }
          } color="brand.primary">
            المراحل
          </Heading>


        </Flex>
      </Box>

      <Breadcrumbs
        breadcrumbs={[
          {
            label: `البرنامج ${programId}`,
            url: `/programs`,
          },
          {
            label: 'المراحل',
            isCurrent: true,
          },
        ]}
      />

      {/* Stages List */}
      <Box mt={10}
        px={{
          lg: '16'
        }}
      >
        <PhasesList />

      </Box>

    </Box>
  );
}