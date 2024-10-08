import { useState, useEffect } from 'react';
import axios from 'axios';
import { ResponseError } from '@/types/response';

export const useFetchFile = (url: string | null, token: string) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      if (!url) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFileUrl(response.data.data);
      } catch (error) {
        const err = error as ResponseError;
        const errorMessage =
          err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [url, token]);

  return { fileUrl, loading, error };
};
