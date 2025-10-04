"use client";

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { SafeImage } from '../ui/SafeImage';
import { Profile } from '../../features/profile/types';
import { updateProfile } from '../../features/profile/updateProfile';
import { Camera } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: Profile;
  onSave: (profile: Profile) => void;
}

export function ProfileEditModal({ isOpen, onClose, currentProfile, onSave }: ProfileEditModalProps) {
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [previewPicture, setPreviewPicture] = useState<string>('');
  const [previewBanner, setPreviewBanner] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: currentProfile.name || '',
        displayName: currentProfile.displayName || '',
        about: currentProfile.about || '',
        picture: currentProfile.picture || '',
        banner: currentProfile.banner || '',
        website: currentProfile.website || '',
        lud16: currentProfile.lud16 || '',
        nip05: currentProfile.nip05 || '',
      });
      setPreviewPicture(currentProfile.picture || '');
      setPreviewBanner(currentProfile.banner || '');
    }
  }, [isOpen, currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateProfile(formData);
      onSave({ ...currentProfile, ...formData });
      onClose();
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'picture') {
      setPreviewPicture(value);
    } else if (field === 'banner') {
      setPreviewBanner(value);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold">プロフィールを編集</h2>

        {/* バナー画像プレビュー */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">バナー画像</label>
          <div className="relative h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {previewBanner ? (
              <SafeImage
                src={previewBanner}
                alt="バナープレビュー"
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera size={32} className="text-gray-400" />
              </div>
            )}
          </div>
          <Input
            type="url"
            placeholder="バナー画像のURL"
            value={formData.banner || ''}
            onChange={(e) => handleInputChange('banner', e.target.value)}
          />
        </div>

        {/* プロフィール画像プレビュー */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">プロフィール画像</label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              {previewPicture ? (
                <SafeImage
                  src={previewPicture}
                  alt="プロフィール画像プレビュー"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera size={24} className="text-gray-400" />
                </div>
              )}
            </div>
            <Input
              type="url"
              placeholder="プロフィール画像のURL"
              value={formData.picture || ''}
              onChange={(e) => handleInputChange('picture', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* 表示名 */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1">
            表示名
          </label>
          <Input
            id="displayName"
            type="text"
            placeholder="表示名"
            value={formData.displayName || ''}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
          />
        </div>

        {/* ユーザー名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            ユーザー名
          </label>
          <Input
            id="name"
            type="text"
            placeholder="ユーザー名"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        {/* 自己紹介 */}
        <div>
          <label htmlFor="about" className="block text-sm font-medium mb-1">
            自己紹介
          </label>
          <Textarea
            id="about"
            placeholder="自己紹介を入力..."
            value={formData.about || ''}
            onChange={(e) => handleInputChange('about', e.target.value)}
            rows={4}
          />
        </div>

        {/* ウェブサイト */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-1">
            ウェブサイト
          </label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourwebsite.com"
            value={formData.website || ''}
            onChange={(e) => handleInputChange('website', e.target.value)}
          />
        </div>

        {/* Lightning Address */}
        <div>
          <label htmlFor="lud16" className="block text-sm font-medium mb-1">
            Lightning Address
          </label>
          <Input
            id="lud16"
            type="text"
            placeholder="user@wallet.com"
            value={formData.lud16 || ''}
            onChange={(e) => handleInputChange('lud16', e.target.value)}
          />
        </div>

        {/* NIP-05 認証 */}
        <div>
          <label htmlFor="nip05" className="block text-sm font-medium mb-1">
            Nostr Address (NIP-05)
          </label>
          <Input
            id="nip05"
            type="text"
            placeholder="user@domain.com"
            value={formData.nip05 || ''}
            onChange={(e) => handleInputChange('nip05', e.target.value)}
          />
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Spinner size="small" /> : '保存'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}