import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Tags, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { useCategories } from '@/hooks/useCategories';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, type Category, type CategoryInput } from '@magazin/shared';

/**
 * Категориялар баракчасы — кошуу, өзгөртүү, өчүрүү
 */
export function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(Permission.CATEGORIES_MANAGE);

  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const locale = i18n.language;

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: CategoryInput) => {
    if (editing) {
      await updateCategory(editing.id, data);
    } else {
      await createCategory(data);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteCategory(deleting.id);
      setDeleting(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(msg ?? t('categories.deleteError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppLayout title={t('nav.categories')}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="h-6 w-6 text-primary" />
            {t('categories.title')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('categories.subtitle')}</p>
        </div>
        {canManage && (
          <Button size="touch" onClick={handleAdd}>
            <Plus className="h-5 w-5" />
            {t('categories.add')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('categories.list')}</CardTitle>
          <CardDescription>
            {t('categories.total', { count: categories.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16">
              <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('categories.empty')}</p>
              {canManage && (
                <Button size="touch" className="mt-4" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  {t('categories.addFirst')}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categories.nameKy')}</TableHead>
                  <TableHead>{t('categories.nameRu')}</TableHead>
                  <TableHead>{t('categories.description')}</TableHead>
                  <TableHead className="text-right">{t('categories.products')}</TableHead>
                  <TableHead>{t('categories.status')}</TableHead>
                  {canManage && (
                    <TableHead className="text-right">{t('categories.actions')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.nameKy}</TableCell>
                    <TableCell>{cat.nameRu}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {cat.description || '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {cat.productCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.isActive ? 'success' : 'muted'}>
                        {cat.isActive ? t('categories.active') : t('categories.inactive')}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-touch"
                            onClick={() => handleEdit(cat)}
                            aria-label={t('common.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-touch"
                            onClick={() => { setDeleting(cat); setDeleteError(''); }}
                            aria-label={t('common.delete')}
                            className="text-destructive hover:text-destructive"
                            disabled={(cat.productCount ?? 0) > 0}
                            title={
                              (cat.productCount ?? 0) > 0
                                ? t('categories.hasProducts')
                                : undefined
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Кошуу/өзгөртүү модалы */}
      <CategoryFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSubmit={handleFormSubmit}
      />

      {/* Өчүрүү ырастоо модалы */}
      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('categories.deleteTitle')}</ModalTitle>
            <ModalDescription>
              {t('categories.deleteDesc', {
                name: deleting
                  ? locale === 'ru'
                    ? deleting.nameRu
                    : deleting.nameKy
                  : '',
              })}
            </ModalDescription>
          </ModalHeader>
          {deleteError && (
            <p className="text-sm text-destructive px-1">{deleteError}</p>
          )}
          <ModalFooter>
            <Button
              variant="outline"
              size="touch"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              size="touch"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
}
