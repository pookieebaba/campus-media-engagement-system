import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { announce } from '../../api/notification.api.js';
import { listBlocks } from '../../api/block.api.js';

export function AnnouncementsPage() {
  const toast = useToast();
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [scope, setScope] = useState('all_students');
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.title = 'Announcements | CMES';
  }, []);

  useEffect(() => {
    listBlocks()
      .then((res) => setBlocks(res.data?.blocks ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setBlocksLoading(false));
  }, []);

  function toggleBlock(blockId) {
    setSelectedBlockIds((prev) =>
      prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    const payload = {
      title: title.trim(),
      message: message.trim(),
      targetRole: 'student',
      ...(scope === 'by_block' && selectedBlockIds.length > 0
        ? { targetBlockIds: selectedBlockIds }
        : {}),
    };

    setSending(true);
    try {
      await announce(payload);
      toast.success('Announcement sent!');
      setTitle('');
      setMessage('');
      setScope('all_students');
      setSelectedBlockIds([]);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title="Announcements">
      <div className="max-w-2xl">
        <Card>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Send Announcement</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              label="Recipients"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setSelectedBlockIds([]);
              }}
            >
              <option value="all_students">All My Students</option>
              <option value="by_block">By Block</option>
            </Select>

            {scope === 'by_block' && (
              <div>
                <p className="text-sm font-semibold text-foreground font-body mb-2">Select Blocks</p>
                {blocksLoading ? (
                  <LoadingSpinner size="sm" centered={false} />
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {blocks.map((block) => (
                      <label
                        key={block._id}
                        className="flex items-center gap-2 cursor-pointer font-body text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBlockIds.includes(block._id)}
                          onChange={() => toggleBlock(block._id)}
                          className="accent-moss"
                        />
                        {block.name} ({block.code})
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Input
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />

            <Textarea
              label="Message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement here…"
            />

            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={Send} loading={sending}>
                Send Announcement
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export default AnnouncementsPage;
