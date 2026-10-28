import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '@/utils/format';

export function useRemote<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const generation = useRef(0);
  useFocusEffect(
    useCallback(() => {
      void version;
      const controller = new AbortController();
      const id = ++generation.current;
      setData(undefined);
      setLoading(true);
      setError('');
      loader(controller.signal)
        .then((result) => {
          if (id === generation.current && !controller.signal.aborted) setData(result);
        })
        .catch((error) => {
          if (id === generation.current && !controller.signal.aborted)
            setError(errorMessage(error));
        })
        .finally(() => {
          if (id === generation.current && !controller.signal.aborted) setLoading(false);
        });
      return () => {
        controller.abort();
      };
    }, [loader, version]),
  );
  return { data, loading, error, reload: () => setVersion((value) => value + 1) };
}
