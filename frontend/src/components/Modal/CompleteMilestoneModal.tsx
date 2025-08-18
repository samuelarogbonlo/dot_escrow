import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Box,
  FormControl,
  FormLabel,
  Textarea,
  HStack,
  Icon,
  IconButton,
  useColorModeValue,
  Badge,
  Flex,
  Input,
  useToast,
  Progress,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { 
  FiUpload, 
  FiFile, 
  FiX, 
  FiImage, 
  FiFileText, 
  FiDownload,
  FiCloud
} from "react-icons/fi";

interface Milestone {
  id: string;
  description: string;
  amount: string;
  deadline: number;
  status: any;
  completionDate?: number;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  cloudinaryUrl?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface CompleteMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  onConfirm: (note: string, fileUrls: Array<{name: string, url: string, type: string, size: number}>) => void;
  isLoading?: boolean;
}

// Cloudinary configuration - Replace with your actual values
const CLOUDINARY_CLOUD_NAME = "dqfjni7gr"; // Replace with your cloud name
const CLOUDINARY_UPLOAD_PRESET = "escrow_project"; // Replace with your upload preset

const CompleteMilestoneModal = ({
  isOpen,
  onClose,
  milestone,
  onConfirm,
  isLoading = false,
}: CompleteMilestoneModalProps) => {
  const [completeNote, setCompleteNote] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const dragOverBg = useColorModeValue("blue.50", "blue.900");
  const dragOverBorder = useColorModeValue("blue.300", "blue.500");

  const handleClose = () => {
    setCompleteNote("");
    setUploadedFiles([]);
    onClose();
  };

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File, fileId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('resource_type', 'auto'); // Allows any file type including PDFs

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, uploadProgress: progress }
                : f
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`);
      xhr.send(formData);
    });
  };

  const handleConfirm = async () => {
    if (uploadedFiles.length === 0) {
      // No files to upload, proceed directly
      onConfirm(completeNote, []);
      setCompleteNote("");
      setUploadedFiles([]);
      return;
    }

    try {
      setIsUploadingFiles(true);

      // Upload files that haven't been uploaded yet
      const uploadPromises = uploadedFiles.map(async (uploadedFile) => {
        if (uploadedFile.cloudinaryUrl) {
          // Already uploaded
          return {
            name: uploadedFile.name,
            url: uploadedFile.cloudinaryUrl,
            type: uploadedFile.type,
            size: uploadedFile.size
          };
        }

        // Upload to Cloudinary
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, isUploading: true, uploadProgress: 0 }
              : f
          )
        );

        const cloudinaryUrl = await uploadToCloudinary(uploadedFile.file, uploadedFile.id);
        
        // Update file with Cloudinary URL
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, cloudinaryUrl, isUploading: false, uploadProgress: 100 }
              : f
          )
        );

        return {
          name: uploadedFile.name,
          url: cloudinaryUrl,
          type: uploadedFile.type,
          size: uploadedFile.size
        };
      });

      const fileUrls = await Promise.all(uploadPromises);
      
      // Send note and file URLs to your backend
      onConfirm(completeNote, fileUrls);
      
      // Reset form after successful submission
      setCompleteNote("");
      setUploadedFiles([]);
      
      toast({
        title: "Files uploaded successfully",
        description: `${fileUrls.length} file(s) uploaded to cloud`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files to cloud. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FiImage;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FiFileText;
    return FiFile;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach(file => {
      // Check file size (limit to 10MB for Cloudinary free tier)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB limit`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isUploading: false,
        uploadProgress: 0,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? uploadedFile : f)
          );
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const hasUploadingFiles = uploadedFiles.some(f => f.isUploading);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Complete Milestone</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={4}>
            <Text>You are about to submit a milestone as completed:</Text>
            
            <Box p={4} bg={bgColor} borderRadius="md" w="100%">
              <Text fontWeight="medium">{milestone?.description}</Text>
              <Text mt={1} color="green.600" fontWeight="semibold">
                Amount: {milestone?.amount} USDT
              </Text>
            </Box>

            <FormControl isRequired>
              <FormLabel>Completion Note</FormLabel>
              <Textarea
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                placeholder="Please describe what you have completed for this milestone..."
                rows={4}
                resize="vertical"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Upload Evidence Files (Optional)</FormLabel>
              
              {/* File Upload Area */}
              <Box
                border="2px dashed"
                borderColor={isDragOver ? dragOverBorder : borderColor}
                borderRadius="md"
                p={6}
                textAlign="center"
                bg={isDragOver ? dragOverBg : bgColor}
                cursor="pointer"
                transition="all 0.2s"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                _hover={{ borderColor: "blue.300", bg: dragOverBg }}
              >
                <Icon as={FiUpload} boxSize={8} color="gray.400" mb={2} />
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Drag and drop files here, or click to browse
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Maximum file size: 10MB • Supports PDFs, images, documents
                </Text>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  display="none"
                />
              </Box>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <VStack align="stretch" spacing={2} mt={4}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">
                      Uploaded Files ({uploadedFiles.length})
                    </Text>
                    <Badge colorScheme="blue" variant="subtle">
                      {uploadedFiles.reduce((acc, file) => acc + file.size, 0) > 0 && 
                        formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))
                      }
                    </Badge>
                  </HStack>
                  
                  {uploadedFiles.map((file) => (
                    <Box
                      key={file.id}
                      p={3}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      bg={bgColor}
                    >
                      <Flex align="center" justify="space-between" mb={file.isUploading ? 2 : 0}>
                        <HStack spacing={3} flex={1}>
                          <Icon 
                            as={file.cloudinaryUrl ? FiCloud : getFileIcon(file.type)} 
                            boxSize={5} 
                            color={file.cloudinaryUrl ? "green.500" : "blue.500"} 
                          />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                              {file.name}
                            </Text>
                            <HStack spacing={2}>
                              <Text fontSize="xs" color="gray.500">
                                {formatFileSize(file.size)}
                              </Text>
                              <Badge size="sm" colorScheme="gray" variant="subtle">
                                {file.type.split('/')[0]}
                              </Badge>
                              {file.cloudinaryUrl && (
                                <Badge size="sm" colorScheme="green" variant="subtle">
                                  Uploaded
                                </Badge>
                              )}
                              {file.isUploading && (
                                <Badge size="sm" colorScheme="blue" variant="subtle">
                                  Uploading...
                                </Badge>
                              )}
                            </HStack>
                          </VStack>
                          {file.preview && (
                            <Box
                              w={10}
                              h={10}
                              borderRadius="md"
                              overflow="hidden"
                              border="1px solid"
                              borderColor={borderColor}
                            >
                              <img
                                src={file.preview}
                                alt={file.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          )}
                        </HStack>
                        <IconButton
                          aria-label="Remove file"
                          icon={<FiX />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeFile(file.id)}
                          isDisabled={file.isUploading}
                        />
                      </Flex>
                      
                      {file.isUploading && (
                        <Progress 
                          value={file.uploadProgress || 0} 
                          size="sm" 
                          colorScheme="blue"
                          borderRadius="md"
                        />
                      )}
                    </Box>
                  ))}
                </VStack>
              )}
            </FormControl>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleConfirm}
            isDisabled={!completeNote.trim() || hasUploadingFiles}
            isLoading={isLoading || isUploadingFiles}
            loadingText={isUploadingFiles ? "Uploading files..." : "Submitting..."}
            leftIcon={<Icon as={FiDownload} />}
          >
            Complete Milestone
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CompleteMilestoneModal;