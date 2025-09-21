"use client";
import { useState } from 'react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { updateProfile } from '../../features/profile/updateProfile';

export default function ProfileEditor() {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, about });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={onSave}>
      <Input placeholder="Display name" value={name} onChange={e => setName(e.target.value)} />
      <Textarea placeholder="About" value={about} onChange={e => setAbout(e.target.value)} />
      <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
    </form>
  );
}
