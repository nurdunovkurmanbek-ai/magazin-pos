import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Package, Loader2, Search, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from '@/components/ui/modal';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { BarcodeEntryModal } from '@/components/products/BarcodeEntryModal';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/components/dashboard/StatCard';
import { Permission, type Product, type ProductInput } from '@magazin/shared';

export function ProductsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { can } = usePermissions();
  const canCreate = can(Permission.PRODUCTS_CREATE);
  const canEdit = can(Permission.PRODUCTS_EDIT);
  const canDelete = can(Permission.PRODUCTS_DELETE);

  const { categories } = useCategories();
  const {
    products, pagination, isLoading, query, setQuery,
    createProduct, updateProduct, deleteProduct, uploadImage,
  } = useProducts();

  const [barcodeGateOpen, setBarcodeGateOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [initialBarcode, setInitialBarcode] = useState('');
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = () => setQuery({ ...query, search, page: 1 });

  const handleAdd = () => {
    setEditing(null);
    setInitialBarcode('');
    setBarcodeGateOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setInitialBarcode('');
    setFormOpen(true);
  };

  const handleBarcodeExisting = (product: Product) => {
    setEditing(product);
    setInitialBarcode('');
    setFormOpen(true);
  };

  const handleBarcodeNew = (barcode: string) => {
    setEditing(null);
    setInitialBarcode(barcode);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: ProductInput) => {
    if (editing) return updateProduct(editing.id, data);
    return createProduct(data);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(deleting.id);
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const catName = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? (locale === 'ru' ? c.nameRu : c.nameKy) : '—';
  };

  return (
    <AppLayout title={t('nav.products')} showSearch={false}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {t('products.title')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('products.subtitle')}</p>
        </div>
        {canCreate && (
          <Button size="touch" onClick={handleAdd}>
            <Plus className="h-5 w-5" />
            {t('products.add')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={query.categoryId ?? ''}
            onChange={(e) => setQuery({ ...query, categoryId: e.target.value || undefined, page: 1 })}
          >
            <option value="">{t('products.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{locale === 'ru' ? c.nameRu : c.nameKy}</option>
            ))}
          </select>
          <Button
            variant={query.lowStock ? 'default' : 'outline'}
            onClick={() => setQuery({ ...query, lowStock: !query.lowStock, page: 1 })}
          >
            <AlertTriangle className="h-4 w-4" />
            {t('products.lowStockOnly')}
          </Button>
          <Button variant="secondary" onClick={handleSearch}>{t('common.search')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('products.list')}</CardTitle>
          <CardDescription>
            {t('products.total', { count: pagination?.total ?? 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">{t('products.empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>{t('products.nameKy')}</TableHead>
                  <TableHead>{t('products.brand')}</TableHead>
                  <TableHead>{t('products.category')}</TableHead>
                  <TableHead className="text-right">{t('products.price')}</TableHead>
                  <TableHead className="text-right">{t('products.stock')}</TableHead>
                  <TableHead>{t('products.shelfLocation')}</TableHead>
                  <TableHead>{t('products.status')}</TableHead>
                  {(canEdit || canDelete) && <TableHead className="text-right">{t('products.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{locale === 'ru' ? p.nameRu : p.nameKy}</p>
                        {p.barcode && <p className="text-xs text-muted-foreground">{p.barcode}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{p.brand || '—'}</TableCell>
                    <TableCell>{catName(p.categoryId)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={p.isLowStock ? 'text-warning font-semibold' : ''}>
                        {p.stock} {p.unit}
                      </span>
                    </TableCell>
                    <TableCell>{p.shelfLocation || '—'}</TableCell>
                    <TableCell>
                      {p.isLowStock ? (
                        <Badge variant="warning">{t('products.lowStockBadge')}</Badge>
                      ) : p.isActive ? (
                        <Badge variant="success">{t('products.active')}</Badge>
                      ) : (
                        <Badge variant="muted">{t('products.inactive')}</Badge>
                      )}
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <Button variant="ghost" size="icon-touch" onClick={() => handleEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon-touch" className="text-destructive" onClick={() => setDeleting(p)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline" size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setQuery({ ...query, page: (query.page ?? 1) - 1 })}
              >
                {t('common.back')}
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setQuery({ ...query, page: (query.page ?? 1) + 1 })}
              >
                →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <BarcodeEntryModal
        open={barcodeGateOpen}
        onOpenChange={setBarcodeGateOpen}
        onExisting={handleBarcodeExisting}
        onNew={handleBarcodeNew}
      />

      <ProductFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        initialBarcode={initialBarcode}
        onSubmit={handleFormSubmit}
        onUploadImage={uploadImage}
      />

      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('products.deleteTitle')}</ModalTitle>
            <ModalDescription>
              {t('products.deleteDesc', { name: deleting ? (locale === 'ru' ? deleting.nameRu : deleting.nameKy) : '' })}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" size="touch" onClick={() => setDeleting(null)} disabled={deleteLoading}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" size="touch" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
}
