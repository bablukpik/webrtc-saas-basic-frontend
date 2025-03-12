export async function checkCameraPermission() {
  try {
    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
    if (permissionStatus.state === 'granted') {
      console.log('Camera permission granted.');
      return true;
    } else if (permissionStatus.state === 'prompt') {
      console.log('Camera permission needs to be requested.');
      return false;
    } else {
      console.log('Camera permission denied.');
      return false;
    }
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
}
