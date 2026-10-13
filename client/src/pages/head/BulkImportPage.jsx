import React, { useEffect, useRef, useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { bulkImport } from '../../api/user.api.js';
import { formatCSVExport } from '../../utils/formatters.js';

const TEMPLATE_CSV = `name,email,password,studentId,blockCode,supervisorEmail
John Doe,john.doe@student.cmes.edu,Student@2024!,ET2024001,ET,faculty.et@cmes.edu`;

export function BulkImportPage() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    document.title = 'Bulk Import | CMES';
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    formatCSVExport(blob, 'student-import-template.csv');
  }

  async function handleUpload() {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);
    setResults(null);
    try {
      const res = await bulkImport(formData);
      setResults(res.data);
      toast.success('Import complete');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Import failed');
    } finally {
      setUploading(false);
    }
  }

  const created = results?.results?.filter((r) => r.status === 'created') ?? [];
  const failed = results?.results?.filter((r) => r.status === 'failed') ?? [];

  const resultColumns = [
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge variant={v === 'created' ? 'present' : 'absent'}>
          {v === 'created' ? 'Created' : 'Failed'}
        </Badge>
      ),
    },
    { key: 'studentId', label: 'Student ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'error',
      label: 'Error',
      render: (v) => v ? <span className="text-destructive text-xs">{v}</span> : '—',
    },
  ];

  return (
    <AppShell title="Bulk Import Students">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions */}
        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
            CSV Format Requirements
          </h2>
          <p className="font-body text-sm text-foreground/60 mb-3">
            Your CSV file must include the following columns:
          </p>
          <ul className="list-disc list-inside font-body text-sm text-foreground/80 mb-4 space-y-1">
            <li><span className="font-semibold">name</span> — Student full name</li>
            <li><span className="font-semibold">email</span> — Student email address</li>
            <li><span className="font-semibold">password</span> — Initial password</li>
            <li><span className="font-semibold">studentId</span> — Unique student ID</li>
            <li><span className="font-semibold">blockCode</span> — Block code (e.g. ET)</li>
            <li><span className="font-semibold">supervisorEmail</span> — Faculty supervisor email</li>
          </ul>
          <p className="font-body text-sm text-foreground/60 mb-2">Example row:</p>
          <pre className="border border-border rounded-xl p-3 text-xs font-mono bg-stone overflow-x-auto text-foreground/80 whitespace-pre-wrap">
            {TEMPLATE_CSV}
          </pre>
          <div className="mt-4">
            <Button variant="secondary" icon={Download} onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>
        </Card>

        {/* Upload */}
        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
            Upload CSV File
          </h2>
          <div
            className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-moss transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload size={32} className="mx-auto text-foreground/40 mb-3" />
            <p className="font-body text-sm text-foreground/60">
              {selectedFile ? selectedFile.name : 'Click or drag & drop a CSV file here'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {selectedFile && (
            <p className="mt-2 text-xs font-body text-foreground/60">
              Selected: <span className="font-semibold">{selectedFile.name}</span>
            </p>
          )}
          <div className="mt-4">
            <Button
              variant="primary"
              icon={Upload}
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              loading={uploading}
            >
              Upload and Import
            </Button>
          </div>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-full text-sm font-body font-semibold bg-moss/10 text-moss">
              {created.length} Created
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-body font-semibold bg-destructive/10 text-destructive">
              {failed.length} Failed
            </span>
          </div>
          <DataTable
            columns={resultColumns}
            data={results.results ?? []}
            emptyTitle="No results"
          />
        </div>
      )}
    </AppShell>
  );
}

export default BulkImportPage;
