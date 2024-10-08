export const getPublicId = (imageUrl: string) => {
  const parts = imageUrl.split('/');
  const uploadIndex = parts.findIndex((part) => part === 'upload');

  if (uploadIndex !== -1) {
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId;
  }
  return null;
};

export const optimizeBase64 = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');

    const isValidBase64 = (str: string) => /^data:image\/(png|jpg|jpeg);base64,[A-Za-z0-9+/=]+$/.test(str);
    if (!isValidBase64(base64)) {
      reject(new Error('Invalid base64 string'));
      return;
    }

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const MAX_WIDTH = 200;
      const MAX_HEIGHT = 200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const optimizedBase64 = canvas.toDataURL('image/png', 1.0);
        resolve(optimizedBase64);
      } catch (error) {
        console.error('Error generating base64 from canvas:', error);
        reject(new Error('Failed to generate optimized base64'));
      }
    };

    img.onerror = (error) => {
      console.error('Image loading error:', error);
      reject(new Error('Failed to load image for optimization'));
    };

    img.src = base64;
  });
};
