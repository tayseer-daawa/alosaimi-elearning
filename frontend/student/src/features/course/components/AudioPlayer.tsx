import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Slider,
  Text,
} from "@chakra-ui/react"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import audioFile from "/assets/audio/020.mp3"
import AudioIcon from "/assets/audio-icon.svg"
export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl] = useState(audioFile)
  const [volume, setVolume] = useState(1) // 1 = 100% volume
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
    }

    const updateDuration = () => {
      if (audio.duration && !Number.isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("durationchange", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("durationchange", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) {
      alert("الرجاء اختيار ملف صوتي أولاً")
      return
    }

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      setIsPlaying(false)
    }
  }

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audio) {
      audio.currentTime = newTime
    }
  }

  const handleVolumeChange = (value: number) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value
    }
  }

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0)
      if (audioRef.current) audioRef.current.volume = 0
    } else {
      setVolume(1)
      if (audioRef.current) audioRef.current.volume = 1
    }
  }

  return (
    <Box
      borderTopWidth={1}
      position={"relative"}
      mx="auto"
      px={6}
      py={4}
      dir="rtl"
    >
      {/* Hidden Audio Element */}
      {/* biome-ignore lint/a11y/useMediaCaption: Captions are not available yet */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title Button with Navigation */}
      <Box
        position="absolute"
        display={{
          base: "flex",
          lg: "none",
        }}
        alignItems="center"
        justifyContent={"space-around"}
        top={-5}
        bg={"brand.secondary"}
        color="white"
        borderRadius="full"
        textAlign="center"
        mx="auto"
        left="50%"
        transform="translateX(-50%)"
        w={"60%"}
      >
        <IconButton
          variant="ghost"
          color="white"
          _hover={{ bg: "whiteAlpha.200" }}
          size="sm"
          aria-label="Previous"
        >
          <ChevronRight size={20} />
        </IconButton>

        <Text fontSize="sm" fontWeight="medium">
          شرح الشيخ العصيمي
        </Text>

        <IconButton
          variant="ghost"
          color="white"
          _hover={{ bg: "whiteAlpha.200" }}
          size="sm"
          aria-label="Next"
        >
          <ChevronLeft size={20} />
        </IconButton>
      </Box>

      {/* Player Controls */}
      <Flex
        align="center"
        w="full"
        px={{
          lg: 24,
        }}
        gap={4}
      >
        <Button
          variant="ghost"
          p={2}
          display={{
            base: "none",
            lg: "block",
          }}
        >
          <Image src={AudioIcon} boxSize={5} objectFit="contain" />
        </Button>

        {/* Volume Control */}
        <Box position="relative">
          <IconButton
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            variant="ghost"
            color="#2D836E"
            _hover={{ color: "#1a4d4a" }}
            aria-label="الصوت"
          >
            {volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </IconButton>

          {/* Volume Slider Popup */}
          {showVolumeSlider && (
            <Box
              position="absolute"
              bottom="100%"
              left="50%"
              transform="translateX(-50%)"
              mb={2}
              bg="white"
              boxShadow="xl"
              borderRadius="lg"
              px={4}
              py={3}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Flex direction="column" align="center" gap={2}>
                <Text fontSize="xs" color="gray.600">
                  {Math.round(volume * 100)}%
                </Text>
                <Slider.Root
                  height="200px"
                  orientation="vertical"
                  min={0}
                  max={100}
                  value={[Math.round(volume * 100)]}
                  onValueChange={({ value }) => {
                    handleVolumeChange(value[0] / 100)
                  }}
                >
                  <Slider.Control>
                    <Slider.Track>
                      <Slider.Range bg={"brand.primary"} />
                    </Slider.Track>
                    <Slider.Thumbs borderColor={"brand.primary"} />
                  </Slider.Control>
                </Slider.Root>
              </Flex>
            </Box>
          )}
        </Box>

        {/* Progress Bar */}
        <Box
          flex={1}
          px={{
            lg: 12,
          }}
        >
          <Slider.Root
            min={0}
            max={duration || 100}
            value={[currentTime]}
            onValueChange={({ value }) => handleProgressChange(value)}
            disabled={!audioUrl}
          >
            <Slider.Control>
              <Slider.Track
                h={0.5}
                borderRadius="4px"
                bg="#e5e7eb"
                opacity={audioUrl ? 1 : 0.5}
                cursor={audioUrl ? "pointer" : "not-allowed"}
              >
                <Slider.Range bg={"brand.secondary"} />
              </Slider.Track>

              <Slider.Thumbs
                boxSize={3}
                bg={"white"}
                borderColor={"brand.secondary"}
                borderRadius="full"
              />
            </Slider.Control>
          </Slider.Root>
        </Box>

        {/* Play/Pause Button */}
        <HStack gap={10}>
          {/* Previous – only on lg+ */}
          <IconButton
            h={10}
            w={10}
            bg={"white"}
            color="brand.secondary"
            borderRadius="full"
            aria-label="السابق"
            display={{ base: "none", lg: "inline-flex" }}
          >
            <SkipForward fill="#2D836E" />
          </IconButton>

          {/* Play / Pause – always visible */}
          <IconButton
            h={10}
            w={10}
            onClick={togglePlay}
            bg="brand.secondary"
            color="white"
            borderRadius="full"
            aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            opacity={audioUrl ? 1 : 0.5}
          >
            {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
          </IconButton>

          {/* Next – only on lg+ */}
          <IconButton
            h={10}
            w={10}
            bg="white"
            color="brand.secondary"
            borderRadius="full"
            aria-label="التالي"
            display={{ base: "none", lg: "inline-flex" }}
          >
            <SkipBack fill="#2D836E" />
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  )
}
