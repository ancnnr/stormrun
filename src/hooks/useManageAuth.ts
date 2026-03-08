import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function useManageAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem('sr_token');
    if (!t) {
      router.replace('/manage');
    } else {
      setToken(t);
      setReady(true);
    }
  }, []);

  return { token, ready };
}
