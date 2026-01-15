import { useEffect, useMemo, useRef } from 'react';

import { describeError, reportError, type DescribedError } from '../lib/errors';

/** Describes a read failure for the screen and logs the original once per distinct error. */
export const useReportedError = (
  context: string,
  error: unknown,
): DescribedError | null => {
  const described = useMemo(
    () => (error ? describeError(error) : null),
    [error],
  );

  const logged = useRef<unknown>(null);
  useEffect(() => {
    if (error && logged.current !== error) {
      logged.current = error;
      reportError(context, error);
    }
  }, [context, error]);

  return described;
};
