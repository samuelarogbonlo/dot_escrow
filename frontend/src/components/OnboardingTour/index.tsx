import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  CloseButton,
  useDisclosure,
  useColorModeValue,
  useToast,
  Portal,
} from '@chakra-ui/react';
import {
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
  FiInfo,
  FiX
} from 'react-icons/fi';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'right' | 'bottom' | 'left';
}

interface OnboardingTourProps {
  tourName: string;
  steps: TourStep[];
  onComplete?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  tourName,
  steps,
  onComplete,
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const { isOpen: isControlledByHook, onClose: onCloseControlled } = useDisclosure({ 
    defaultIsOpen: true,
  });
  const [hasSeenTour, setHasSeenTour] = useLocalStorage(`tour_${tourName}`, false);
  const toast = useToast();
  
  // Use either the controlled or uncontrolled state
  const isOpen = propIsOpen !== undefined ? propIsOpen : isControlledByHook && !hasSeenTour;
  const onClose = propOnClose || onCloseControlled;
  
  // UI colors
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('blue.500', 'blue.400');
  
  // Calculate position for the tooltip
  const calculatePosition = (element: HTMLElement, placement: string) => {
    if (!element) return { top: 0, left: 0 };
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    // Add margin around the target element
    const margin = 15;
    
    let top = 0;
    let left = 0;
    
    switch (placement) {
      case 'top':
        top = rect.top + scrollTop - margin;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'right':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + margin;
        break;
      case 'bottom':
        top = rect.bottom + scrollTop + margin;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - margin;
        break;
      default:
        top = rect.bottom + scrollTop + margin;
        left = rect.left + scrollLeft + rect.width / 2;
    }
    
    return { top, left };
  };
  
  // Add highlight to target element
  const highlightTarget = (element: HTMLElement | null) => {
    if (!element) return;
    
    // Store original styles
    const originalPosition = element.style.position;
    const originalZIndex = element.style.zIndex;
    const originalOutline = element.style.outline;
    
    // Apply highlight styles
    element.style.position = 'relative';
    element.style.zIndex = '9999';
    element.style.outline = `2px solid ${highlightColor}`;
    element.style.boxShadow = '0 0 10px rgba(66, 153, 225, 0.5)';
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Return function to remove highlight
    return () => {
      element.style.position = originalPosition;
      element.style.zIndex = originalZIndex;
      element.style.outline = originalOutline;
      element.style.boxShadow = '';
    };
  };
  
  // Find current target element and position tooltip
  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;
    
    const targetSelector = steps[currentStep].target;
    const element = document.querySelector(targetSelector) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      const position = calculatePosition(element, steps[currentStep].placement);
      setTooltipPosition(position);
      
      const removeHighlight = highlightTarget(element);
      
      // Handle resize and scroll
      const handlePositionChange = () => {
        const newPosition = calculatePosition(element, steps[currentStep].placement);
        setTooltipPosition(newPosition);
      };
      
      window.addEventListener('resize', handlePositionChange);
      window.addEventListener('scroll', handlePositionChange);
      
      return () => {
        if (removeHighlight) removeHighlight();
        window.removeEventListener('resize', handlePositionChange);
        window.removeEventListener('scroll', handlePositionChange);
      };
    } else {
      console.warn(`Target element not found: ${targetSelector}`);
    }
  }, [isOpen, currentStep, steps]);
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle tour completion
  const handleComplete = () => {
    setHasSeenTour(true);
    onClose();
    
    if (onComplete) {
      onComplete();
    }
    
    toast({
      title: 'Tour completed',
      description: 'You can access the tour again from the help menu',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Handle tour close
  const handleClose = () => {
    onClose();
    
    toast({
      title: 'Tour closed',
      description: 'You can restart the tour anytime from the help menu',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Skip tour
  const handleSkip = () => {
    setHasSeenTour(true);
    onClose();
  };
  
  // Reset tour
  const resetTour = () => {
    setHasSeenTour(false);
    setCurrentStep(0);
  };
  
  if (!isOpen) return null;
  
  // Determine tooltip position styles based on placement
  const getTooltipStyle = () => {
    const placement = steps[currentStep]?.placement || 'bottom';
    const { top, left } = tooltipPosition;
    const baseShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    const basePosition = {
      position: 'absolute' as const,
      width: '300px',
      zIndex: 10000,
      boxShadow: baseShadow,
      backgroundColor: tooltipBg,
      borderRadius: 'md',
      border: '1px solid',
      borderColor: tooltipBorder,
    };
    
    switch (placement) {
      case 'top':
        return {
          ...basePosition,
          bottom: `calc(100vh - ${top}px)`,
          left: `${left - 150}px`, // half of width
          transform: 'translateY(-20px)',
        };
      case 'right':
        return {
          ...basePosition,
          top: `${top - 100}px`, // half of height
          left: `${left + 20}px`,
        };
      case 'bottom':
        return {
          ...basePosition,
          top: `${top + 20}px`,
          left: `${left - 150}px`, // half of width
        };
      case 'left':
        return {
          ...basePosition,
          top: `${top - 100}px`, // half of height
          right: `calc(100vw - ${left}px)`,
          transform: 'translateX(-20px)',
        };
      default:
        return basePosition;
    }
  };
  
  return (
    <Portal>
      <Box
        sx={getTooltipStyle()}
        role="tooltip"
        p={4}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={2}>
          <Heading size="sm" color={highlightColor}>
            {steps[currentStep]?.title}
          </Heading>
          <CloseButton size="sm" onClick={handleClose} />
        </Flex>
        
        {/* Content */}
        <Text fontSize="sm" mb={4}>
          {steps[currentStep]?.content}
        </Text>
        
        {/* Progress */}
        <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="xs" color="gray.500">
            Step {currentStep + 1} of {steps.length}
          </Text>
          
          <HStack spacing={2}>
            {currentStep > 0 && (
              <IconButton
                aria-label="Previous step"
                icon={<FiArrowLeft />}
                size="sm"
                variant="ghost"
                onClick={handlePrevious}
              />
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button 
                rightIcon={<FiArrowRight />} 
                colorScheme="blue" 
                size="sm"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button 
                rightIcon={<FiCheckCircle />} 
                colorScheme="green" 
                size="sm"
                onClick={handleComplete}
              >
                Finish
              </Button>
            )}
          </HStack>
        </Flex>
        
        {/* Skip Button */}
        <Button
          variant="link"
          size="xs"
          onClick={handleSkip}
          color="gray.500"
          mt={2}
        >
          Skip tour
        </Button>
      </Box>
    </Portal>
  );
};

 