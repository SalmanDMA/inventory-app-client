import { useState, useEffect } from 'react';
import axios from 'axios';
import { ResponseError } from '@/types/response';

const defaultImage = 'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/kqxu49becrexogjdwsix';

export const useFetchFile = (url: string | null, token: string) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchFile = async () => {
      if (!url) {
        setFileUrl(defaultImage);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (response.data?.data) {
          setFileUrl(response.data.data);
        } else {
          setFileUrl(defaultImage);
        }
      } catch (error) {
        const err = error as ResponseError;
        const errorMessage =
          err?.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

        setFileUrl(defaultImage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      controller.abort();
    };
  }, [url, token]);

  return { fileUrl, loading, error };
};
