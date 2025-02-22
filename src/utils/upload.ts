import axios from 'axios';

export const uploadToS3 = async (file: Blob) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('http://localhost:5000/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.fileUrl; // Assuming your backend returns the file URL
}; 