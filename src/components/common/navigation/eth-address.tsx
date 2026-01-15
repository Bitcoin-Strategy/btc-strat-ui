'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '../../ui';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui';

interface EthAddressProps {
  address?: string;
}

export function EthAddress({ address }: EthAddressProps) {
  const [copied, setCopied] = useState(false);
  if (!address) return null;

  const shortAddress = `${address.slice(0, 6)}…${address.slice(-4)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={handleCopy} className="cursor-default font-mono">
            {shortAddress}
          </button>
        </TooltipTrigger>
        <TooltipContent
          onClick={handleCopy}
          className="cursor-pointer"
          side="top"
        >
          <p className="font-mono">{address}</p>
        </TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label="Copy address"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
