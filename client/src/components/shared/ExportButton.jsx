import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatCSVExport } from '../../utils/formatters.js';

export function ExportButton({ onExport, filename = 'export.csv', children = 'Export CSV', ...props }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const blob = await onExport();
      formatCSVExport(blob, filename);
    } catch {
      // Error handling done by parent via toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      icon={Download}
      loading={loading}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}

export default ExportButton;
