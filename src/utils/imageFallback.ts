// Fallback image processor for problematic images
export const processImageFallback = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // For problematic images, try to read them directly without compression
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      const sizeInKB = Math.round(result.length / 1024);
      
      console.log(`Fallback image processing: ${sizeInKB}KB (no compression)`);
      
      // If the image is too large even for fallback, reject
      if (sizeInKB > 10240) { // 10MB limit for fallback (increased from 2MB)
        reject(new Error('Image is too large even for fallback processing. Please use an image under 10MB.'));
        return;
      }
      
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file in fallback mode'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Simple image validation without processing
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File is not an image. Please select a JPEG, PNG, or other image file.'
    };
  }

  // Check file size (more generous limit for fallback)
  const maxSize = 10 * 1024 * 1024; // 10MB (increased from 5MB)
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image size ${Math.round(file.size / 1024 / 1024)}MB exceeds limit of 10MB. Please choose a smaller image.`
    };
  }

  // Check for common problematic formats
  const problematicTypes = ['image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
  if (problematicTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'This image format is not supported. Please use JPEG, PNG, or WebP formats.'
    };
  }

  return { valid: true };
};
