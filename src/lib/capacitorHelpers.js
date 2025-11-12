import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Device } from '@capacitor/device'

// Check if we're running on a mobile device
export const isMobile = async () => {
  const info = await Device.getInfo()
  return info.platform === 'android' || info.platform === 'ios'
}

// Request camera permissions and take photo
export const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    })
    
    return {
      success: true,
      dataUrl: image.dataUrl,
      format: image.format
    }
  } catch (error) {
    console.error('Camera error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Request camera permissions and select from gallery
export const selectFromGallery = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    })
    
    return {
      success: true,
      dataUrl: image.dataUrl,
      format: image.format
    }
  } catch (error) {
    console.error('Gallery error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Convert DataURL to File object
export const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}

// Check camera permissions
export const checkCameraPermissions = async () => {
  try {
    const permissions = await Camera.checkPermissions()
    return permissions.camera === 'granted'
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

// Request camera permissions
export const requestCameraPermissions = async () => {
  try {
    const permissions = await Camera.requestPermissions()
    return permissions.camera === 'granted'
  } catch (error) {
    console.error('Permission request error:', error)
    return false
  }
}

// Show action sheet for photo options
export const showPhotoActionSheet = () => {
  return new Promise((resolve) => {
    if (window.confirm('Choose photo source:\nOK for Camera, Cancel for Gallery')) {
      resolve('camera')
    } else {
      resolve('gallery')
    }
  })
}

// Enhanced file picker for mobile
export const pickFile = async () => {
  const mobile = await isMobile()
  
  if (mobile) {
    // On mobile, use gallery picker
    return await selectFromGallery()
  } else {
    // On web, use regular file input
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,.pdf,.doc,.docx'
      
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              success: true,
              dataUrl: reader.result,
              file: file
            })
          }
          reader.readAsDataURL(file)
        } else {
          resolve({ success: false, error: 'No file selected' })
        }
      }
      
      input.click()
    })
  }
}