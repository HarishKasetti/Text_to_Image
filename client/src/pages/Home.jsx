import React, { useContext, useState } from 'react';
import Header from '../components/Header';
import Description from '../components/Description';
import Steps from '../components/Steps';
import Testimonials from '../components/Testimonials';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const Home = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');

  const { user, token, credits, setCredits, setShLogin } = useContext(AppContext);

  const handleGenerateImage = async (e) => {
    e.preventDefault();

    if (!token) {
      setShLogin(true);
      return;
    }

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

      if (response.data?.resultImage) {
        setGeneratedImage(response.data.resultImage);
        if (typeof response.data.creditsRemaining === 'number') {
          setCredits(response.data.creditsRemaining);
        }
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow">
      <Header />

      {user && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="text-gray-800 font-semibold">
                Logged in as <span className="font-bold">{user.name || user.email}</span>
              </div>
              <div className="text-sm text-gray-600">
                Credits remaining: <span className="font-semibold">{credits}</span>
              </div>
            </div>

            <form onSubmit={handleGenerateImage} className="space-y-4">
              <div>
                <label htmlFor="home-prompt" className="block text-sm font-medium text-gray-700 mb-1">
                  Describe the image you want to generate
                </label>
                <textarea
                  id="home-prompt"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="A neon cyberpunk city at night..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex items-center justify-end">
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

            {generatedImage && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Generated Image</h2>
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
        </section>
      )}

      <Description />
      <Steps />
      <Testimonials />
    </main>
  );
};

export default Home;
