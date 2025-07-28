import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ProjectCallback() {
  const router = useRouter();

  useEffect(() => {
    console.log('Post-login, ready to navigate!'); // Does it crash here?
    router.push('/');
  }, []);


  return null;
}
