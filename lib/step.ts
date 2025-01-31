export async function extractTextWithStep(image: string | File) {
  try {
    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch('/api/ocr/step', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.text;
  } catch (error: any) {
    console.error('Step OCR error:', error);
    throw error;
  }
} 