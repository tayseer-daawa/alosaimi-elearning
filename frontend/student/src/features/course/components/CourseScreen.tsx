import { useState } from 'react';
import { Box, Button, Flex, Text, Container, Heading, Image } from '@chakra-ui/react';
import { MoveRight, MoveLeft } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { Breadcrumbs } from '@/shared/components/BreadcrumbsNavigation';
import MenuIcon from '/assets/menu.svg'

export default function CourseScreen() {
  const [activeTab, setActiveTab] = useState('content');


  return (
    <Box minH="100vh" dir="rtl"
      px={{
        lg: '16'
      }}
      py={{
        lg: '10'
      }}
      overflow={'auto'}
    >
      {/* Header */}
      <Box >
        <Container maxW="container.lg" px={4} py={4}>
          {/* Breadcrumb */}
          <Flex
            display={{
              base: 'none',
              lg: 'flex'
            }}
            align="center" justify="center" h={'100%'} >
            <Button
              position={'absolute'} right={{
                base: 0,
                lg: 0
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
              المقررات
            </Heading>
          </Flex>

          <Breadcrumbs
            breadcrumbs={[
              {
                label: 'البرامج',
                url: '/programs',
              },
              {
                label: 'المرحلة 1',
                url: '/phases',
              },
              {
                label: 'الكتاب 1',
                url: '/books',
              },
              {
                label: 'المقرر 1',
                isCurrent: true,
                hasDropdown: true,
                options: [
                  { label: 'المقرر 1', url: '/course' },
                  { label: 'المقرر 2', url: '/course' },
                  { label: 'المقرر 3', url: '/course' },
                  { label: 'المقرر 4', url: '/course' },
                ],
              }
            ]}
          />

        </Container>
      </Box>
      <Flex
        display={{
          base: 'flex',
          lg: 'none'
        }}
        justify="space-between" alignItems={'center'} mb={8} px={3}>
        <Button
          variant="ghost"
          size="sm"
          color="brand.primary"
          _hover={{ color: 'gray.800' }}
        >
          <MoveRight size={20} />
          <Text>التالي</Text>
        </Button>

        <Text
          fontSize="2xl"
          fontWeight="semibold"
          color="text.default"
          textAlign="center"
        >
          المقرر 1
        </Text>
        <Button
          variant="ghost"
          size="sm"
          color="brand.primary"
          _hover={{ color: 'gray.800' }}
        >
          <Text >السابق</Text>
          <MoveLeft size={20} />
        </Button>
      </Flex>

      {/* Content */}
      <Container
      bg={'white'}
        w={{
          base: '80%',
          lg: '100%'
        }}
        mx={'auto'}
        mt={{
          lg: '20'
        }}
        mb={{
          base: '32'
        }}

        px={4}
        py={8}
        boxShadow={{
          base: 'lg',
          lg: 'none'

        }} borderRadius={4}  >
        {/* Tabs */}
        <Flex
          display={{
            base: 'flex',
            lg: 'none'
          }}
          mb={6} gap={2}>
          <Button
            size={'sm'}
            flex={1}
            onClick={() => setActiveTab('content')}
            bg={activeTab === 'content' ? 'brand.primary' : 'white'}
            color={activeTab === 'content' ? 'white' : 'gray.600'}
            borderRadius="lg"
            fontWeight="medium"
          >
            الكتاب
          </Button>
          <Button
            size={'sm'}
            flex={1}
            onClick={() => setActiveTab('notes')}
            bg={activeTab === 'notes' ? 'gray.200' : 'gray.100'}
            color={activeTab === 'notes' ? 'gray.800' : 'gray.600'}
            borderRadius="lg"
            fontWeight="medium"
          >
            الملاحظات
          </Button>
        </Flex>
        {activeTab === 'content' && (
          <Box p={2} >
            <Text
              color="brand.primary"
              fontSize={{
                base: 'md',
                lg: '2xl'
              }}
              textAlign="justify"
              lineHeight={{
                base:1.8,
                lg:2
              }}

            >
              إنَّ الحمدَ للهِ نحمَدُه ونَستعينُه ونستغفرُه ونستهديهِ ونشكرُه، ونعوذُ  باللهِ منْ شرورِ أنفُسِنا ومِن سيئاتِ أعمالِنا، مَنْ يهْدِ اللهُ فلا  مُضلَّ لهُ، ومَنْ يُضْلِلْ فلا هاديَ لهُ. وأشهدُ أن لا إلـهَ إلا اللهُ  وحْدَهُ لا شريكَ لهُ، ولا مَثِيلَ ولا شبيهَ ولا ضِدَّ ولا نِدَّ لَهُ.  وأشهدُ أنَّ سيّدَنا وحبيبَنا وعظيمَنا وقائدَنا وَقُرَّةَ أَعْيُنِنا  مُحَمَّدًا عبدُه ورسولُه، وصفيُّه وحبيبُه، مَنْ بعثَهُ اللهُ رحمةً  للعالمينَ، هاديًا ومُبشِّرًا ونذيرًا، بَلَّغَ الرسالةَ وأدَّى الأمانةَ  ونصحَ الأُمَّةَ، فجزاهُ اللهُ عنَّا خيرَ ما جَزَى نبيًّا مِنْ أنبيائهِ.  اللهُمَّ صَلِّ على سَيِّدِنا مُحمَّدٍ وعلَى ءالِه وأَصْحَابِهِ  الطَّيِّبِينَ الطَّاهِرينَ.
            </Text>
          </Box>
        )}

        {activeTab === 'notes' && (
          <Box >
            <Text color="gray.500" textAlign="center">لا توجد ملاحظات حتى الآن</Text>
          </Box>
        )}
      </Container>

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        boxShadow="lg"
        borderTop="1px solid"
        borderColor="brand.secondary"
      >
        <AudioPlayer />

      </Box>

    </Box>
  );
}