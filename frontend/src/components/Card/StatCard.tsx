import React from 'react'
import { Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Flex, Icon, Skeleton, useColorModeValue } from '@chakra-ui/react'

interface StatCardProps {
  label: string
  value: string | number
  helpText?: string
  icon: React.ElementType
  colorScheme?: string
  isLoading?: boolean
}

const StatCard = ({
  label,
  value,
  helpText,
  icon,
  colorScheme = "blue",
  isLoading = false
}: StatCardProps) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel fontSize="sm" color="gray.500">{label}</StatLabel>
          {isLoading ? (
            <Skeleton height="30px" width="80px" my="2" />
          ) : (
            <StatNumber fontSize="2xl">{value}</StatNumber>
          )}
          {helpText && !isLoading && (
            <StatHelpText>
              <StatArrow type="increase" />
              {helpText}
            </StatHelpText>
          )}
        </Stat>
        <Flex
          w="12"
          h="12"
          align="center"
          justify="center"
          rounded="full"
          bg={`${colorScheme}.100`}
        >
          <Icon as={icon} boxSize="6" color={`${colorScheme}.700`} />
        </Flex>
      </Flex>
    </Box>
  )
}

export default StatCard
