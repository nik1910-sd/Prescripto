import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {
  const { userData, setUserData, backendUrl, token, loadUserProfileData } = useContext(AppContext)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const formData = new FormData()
      formData.append('userId', userData._id)
      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('dob', userData.dob)
      formData.append('gender', userData.gender)
      
      if (userData.imageFile) {
        formData.append('image', userData.imageFile)
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            token: token
          }
        }
      )

      if (data.success) {
        toast.success('Profile updated successfully')
        await loadUserProfileData()
        setIsEdit(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUserData(prev => ({
          ...prev,
          image: e.target.result,
          imageFile: file
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className='max-w-lg flex flex-col gap-2 text-sm p-4'>
      <div className="relative">
        <img className='w-36 rounded' src={userData.image} alt="Profile" />
        {isEdit && (
          <label className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white p-1 text-xs cursor-pointer">
            Change Photo
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        )}
      </div>
      
      {isEdit ? (
        <input 
          className='bg-gray-50 text-3xl font-medium max-w-60 mt-4 p-2 border rounded' 
          type="text" 
          value={userData.name} 
          onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))}
        />
      ) : (
        <p className='font-medium text-3xl text-neutral-800 mt-4'>{userData.name}</p>
      )}

      <hr className='bg-zinc-400 h-[1px] border-none' />
      
      <div>
        <p className='text-neutral-500 underline mt-3'>Contact Info</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email id:</p>
          <p className='text-blue-500'>{userData.email}</p>
          
          <p className='font-medium'>Phone:</p>
          {isEdit ? (
            <input 
              className='bg-gray-100 max-w-52 p-2 border rounded' 
              type="text" 
              value={userData.phone} 
              onChange={e => setUserData(prev => ({ ...prev, phone: e.target.value }))}
            />
          ) : (
            <p className='text-blue-400'>{userData.phone}</p>
          )}
          
          <p className='font-medium'>Address:</p>
          {isEdit ? (
            <div>
              <input
                className='bg-gray-50 p-2 border rounded w-full mb-2'
                placeholder="Address Line 1"
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...(prev.address || {}), line1: e.target.value },
                  }))
                }
                value={userData?.address?.line1 || ""}
              />
              <input
                className='bg-gray-50 p-2 border rounded w-full'
                placeholder="Address Line 2"
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...(prev.address || {}), line2: e.target.value },
                  }))
                }
                value={userData?.address?.line2 || ""}
              />
            </div>
          ) : (
            <p className='text-neutral-700'>
              {userData?.address?.line1 || ""}
              <br />
              {userData?.address?.line2 || ""}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className='text-neutral-500 underline mt-3'>Basic Information</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Gender:</p>
          {isEdit ? (
            <select 
              className='max-w-20 bg-gray-100 p-2 border rounded' 
              onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} 
              value={userData.gender}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Not Selected">Prefer not to say</option>
            </select>
          ) : (
            <p className='text-gray-400'>{userData.gender}</p>
          )}

          <p className='font-medium'>Birthday:</p>
          {isEdit ? (
            <input 
              className='max-w-28 bg-gray-100 p-2 border rounded' 
              type="date" 
              onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} 
              value={userData.dob} 
            />
          ) : (
            <p className='text-gray-400'>{userData.dob}</p>
          )}
        </div>
      </div>

      <div className='mt-10'>
        {isEdit ? (
          <div className="flex gap-4">
            <button 
              className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Information'}
            </button>
            <button 
              className='border border-gray-400 px-8 py-2 rounded-full hover:bg-gray-400 hover:text-white transition-all'
              onClick={() => setIsEdit(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
            onClick={() => setIsEdit(true)}
          >
            Edit Information
          </button>
        )}
      </div>
    </div>
  )
}

export default MyProfile