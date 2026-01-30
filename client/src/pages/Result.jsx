import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const Result = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const { token, credits, setCredits } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  const handleGenerateImage = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (credits < 1) {
      setError('Not enough credits. Please purchase more credits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/image/generate-image',
        { prompt },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.resultImage) {
        setGeneratedImage(response.data.resultImage);
        setCredits(response.data.creditsRemaining);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error.response?.data?.error || 'Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Generate AI Image</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleGenerateImage} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Describe the image you want to generate
              </label>
              <textarea
                id="prompt"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="A beautiful sunset over mountains..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Credits remaining: <span className="font-semibold">{credits}</span>
              </div>
              <button
                type="submit"
                disabled={loading || credits < 1}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  loading || credits < 1
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </form>
        </div>

        {generatedImage && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Image</h2>
            <div className="flex justify-center">
              <img
                src={generatedImage}
                alt="Generated content"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;
