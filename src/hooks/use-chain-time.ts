import { useEffect, useRef, useState } from 'react';
import { useBlock } from 'wagmi';

import { PROTOCOL_CHAIN } from '../lib/chains';
import { REFRESH, STALE } from '../lib/refresh';

/** Chain time: deadlines use `block.timestamp`, so the offset to the local clock is re-measured on each block. */
export const useChainTime = (tickMs = 1000): number => {
  const { data: block } = useBlock({
    chainId: PROTOCOL_CHAIN.id,
    query: { refetchInterval: REFRESH.slow, staleTime: STALE.slow },
  });

  const offset = useRef(0);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  const blockTimestamp = block ? Number(block.timestamp) : 0;

  useEffect(() => {
    if (blockTimestamp > 0) {
      offset.current = blockTimestamp - Math.floor(Date.now() / 1000);
    }

    const update = () => setNow(Math.floor(Date.now() / 1000) + offset.current);

    update();
    const id = setInterval(update, tickMs);
    return () => clearInterval(id);
  }, [blockTimestamp, tickMs]);

  return now;
};
