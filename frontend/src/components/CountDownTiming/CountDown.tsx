import { useState, useEffect } from "react";
import { Text, HStack, Badge } from "@chakra-ui/react";
// import { useColorModeValue } from "@chakra-ui/react";

interface CountdownProps {
  targetDate: number | string
  size?: "sm" | "md" | "lg";
}

const Countdown = ({ targetDate, size = "sm" }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isExpired, setIsExpired] = useState(false);

  // Color mode values (unused for now but kept for future styling)
  // const expiredBg = useColorModeValue("red.50", "red.900");
  // const expiredColor = useColorModeValue("red.600", "red.300");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  const getSizeProps = () => {
    switch (size) {
      case "sm":
        return {
          fontSize: "xs",
          spacing: 1,
          badgeSize: "sm",
        };
      case "md":
        return {
          fontSize: "sm",
          spacing: 2,
          badgeSize: "md",
        };
      case "lg":
        return {
          fontSize: "md",
          spacing: 3,
          badgeSize: "lg",
        };
      default:
        return {
          fontSize: "xs",
          spacing: 1,
          badgeSize: "sm",
        };
    }
  };

  const sizeProps = getSizeProps();

  if (isExpired) {
    return (
      <Badge
        colorScheme="red"
        variant="subtle"
        size={sizeProps.badgeSize}
        borderRadius="md"
      >
        Expired
      </Badge>
    );
  }

  // For very compact display, show only the most relevant time unit
  if (size === "sm") {
    if (timeLeft.days > 0) {
      return (
        <Text fontSize="xs" color="gray.600" fontWeight="medium">
          {timeLeft.days}d {formatNumber(timeLeft.hours)}h {formatNumber(timeLeft.minutes)}m {formatNumber(timeLeft.seconds)}s
        </Text>
      );
    } else if (timeLeft.hours > 0) {
      return (
        <Text fontSize="xs" color="orange.600" fontWeight="medium">
          {timeLeft.hours}h {formatNumber(timeLeft.minutes)}m
        </Text>
      );
    } else {
      return (
        <Text fontSize="xs" color="red.600" fontWeight="medium">
          {timeLeft.minutes}m {formatNumber(timeLeft.seconds)}s
        </Text>
      );
    }
  }

  // For medium and large sizes, show full countdown
  return (
    <HStack spacing={sizeProps.spacing}>
      {timeLeft.days > 0 && (
        <Badge colorScheme="blue" size={sizeProps.badgeSize}>
          {timeLeft.days}d
        </Badge>
      )}
      {(timeLeft.hours > 0 || timeLeft.days > 0) && (
        <Badge colorScheme="green" size={sizeProps.badgeSize}>
          {formatNumber(timeLeft.hours)}h
        </Badge>
      )}
      <Badge colorScheme="yellow" size={sizeProps.badgeSize}>
        {formatNumber(timeLeft.minutes)}m
      </Badge>
      <Badge colorScheme="red" size={sizeProps.badgeSize}>
        {formatNumber(timeLeft.seconds)}s
      </Badge>
    </HStack>
  );
};

export default Countdown;