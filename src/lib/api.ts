// Function to upload blob to S3
export const uploadToS3 = async (blob: Blob): Promise<string> => {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
    formData.append('file', file);

    // Send the file to your API endpoint
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data.fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

// Function to save recording metadata to your database
export const saveRecording = async (fileUrl: string): Promise<void> => {
  try {
    const response = await fetch('/api/recordings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to save recording');
    }
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
}; 