import React, { useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'

const Profile = () => {
  const { user, credits, token, navigate } = useContext(AppContext)

  useEffect(() => {
    if (!token) {
      navigate('/')
    }
  }, [token, navigate])

  if (!user) {
    return (
      <div className='min-h-[80vh] pt-20'>
        <div className='max-w-2xl mx-auto bg-white rounded-lg shadow-sm border p-6'>
          <h1 className='text-2xl font-semibold text-gray-800'>Profile</h1>
          <p className='mt-2 text-gray-600'>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-[80vh] pt-20'>
      <div className='max-w-2xl mx-auto bg-white rounded-lg shadow-sm border p-6'>
        <h1 className='text-2xl font-semibold text-gray-800'>Profile</h1>

        <div className='mt-6 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500'>Name</span>
            <span className='text-sm font-medium text-gray-800'>{user.name || '—'}</span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500'>Email</span>
            <span className='text-sm font-medium text-gray-800'>{user.email || '—'}</span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500'>Credits</span>
            <span className='text-sm font-semibold text-gray-800'>{credits}</span>
          </div>
        </div>

        <div className='mt-8 flex gap-3'>
          <button
            className='px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700'
            onClick={() => navigate('/result')}
          >
            Generate Image
          </button>
          <button
            className='px-4 py-2 rounded-md bg-gray-800 text-white text-sm font-medium hover:bg-gray-900'
            onClick={() => navigate('/buy')}
          >
            Buy Credits
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
