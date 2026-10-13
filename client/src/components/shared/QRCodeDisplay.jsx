import React from 'react';
import { Download } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';

export function QRCodeDisplay({ dataURL, altText = 'QR Code', eventTitle }) {
  if (!dataURL) {
    return <LoadingSpinner />;
  }

  function handleDownload() {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <Card className="rounded-2xl shadow-card p-6 flex flex-col items-center gap-4">
      {eventTitle && (
        <p className="font-heading text-lg font-semibold text-foreground text-center">{eventTitle}</p>
      )}
      <img
        src={dataURL}
        alt={altText}
        className="mx-auto max-w-xs w-full rounded-2xl"
      />
      <Button variant="secondary" icon={Download} onClick={handleDownload}>
        Download QR Code
      </Button>
    </Card>
  );
}

export default QRCodeDisplay;
