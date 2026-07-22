import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal';
import type { Category, CategoryInput } from '@magazin/shared';

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (data: CategoryInput) => Promise<void>;
}

/**
 * Категория кошуу/өзгөртүү формасы
 */
export function CategoryFormModal({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryFormModalProps) {
  const { t } = useTranslation();
  const isEdit = !!category;

  const [nameKy, setNameKy] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNameKy(category?.nameKy ?? '');
      setNameRu(category?.nameRu ?? '');
      setDescription(category?.description ?? '');
      setIsActive(category?.isActive ?? true);
      setError('');
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        nameKy: nameKy.trim(),
        nameRu: nameRu.trim(),
        description: description.trim() || undefined,
        isActive,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categories.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              {isEdit ? t('categories.editTitle') : t('categories.addTitle')}
            </ModalTitle>
            <ModalDescription>
              {isEdit ? t('categories.editDesc') : t('categories.addDesc')}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nameKy">{t('categories.nameKy')}</Label>
              <Input
                id="nameKy"
                touch
                value={nameKy}
                onChange={(e) => setNameKy(e.target.value)}
                placeholder={t('categories.nameKyPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameRu">{t('categories.nameRu')}</Label>
              <Input
                id="nameRu"
                touch
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
                placeholder={t('categories.nameRuPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('categories.description')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('categories.descriptionPlaceholder')}
              />
            </div>

            <label className="flex items-center gap-3 min-h-touch cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-input accent-primary"
              />
              <span className="text-sm font-medium">{t('categories.isActive')}</span>
            </label>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              size="touch"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="touch" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.save')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
