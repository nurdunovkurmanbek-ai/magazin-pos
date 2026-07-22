import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, ImageIcon, ScanBarcode } from 'lucide-react';
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
import { useCategories } from '@/hooks/useCategories';
import {
  buildProductQrUrl,
  allowsInternalBarcode,
  type Product,
  type ProductInput,
} from '@magazin/shared';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  /** Жаңы товар үчүн алдын ала штрихкод */
  initialBarcode?: string;
  onSubmit: (data: ProductInput) => Promise<Product>;
  onUploadImage?: (id: string, file: File) => Promise<void>;
}

function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

const emptyForm = (categoryId = '', barcode = ''): ProductInput => ({
  nameKy: '',
  nameRu: '',
  barcode,
  barcodeType: 'FACTORY',
  soldByWeight: false,
  isSelfPacked: false,
  noFactoryBarcode: !barcode,
  generateInternalBarcode: false,
  qrCode: '',
  brand: '',
  description: '',
  price: 0,
  costPrice: 0,
  stock: 0,
  minStock: 10,
  unit: 'шт',
  supplier: '',
  arrivalDate: '',
  expiryDate: '',
  shelfLocation: '',
  categoryId,
  isActive: true,
});

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  initialBarcode = '',
  onSubmit,
  onUploadImage,
}: ProductFormModalProps) {
  const { t, i18n } = useTranslation();
  const { categories } = useCategories();
  const fileRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const isEdit = !!product;

  const [form, setForm] = useState<ProductInput>(emptyForm());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (product) {
      setForm({
        nameKy: product.nameKy,
        nameRu: product.nameRu,
        barcode: product.barcode ?? '',
        barcodeType: product.barcodeType ?? 'FACTORY',
        soldByWeight: product.soldByWeight ?? false,
        isSelfPacked: product.isSelfPacked ?? false,
        noFactoryBarcode: product.noFactoryBarcode ?? false,
        generateInternalBarcode: false,
        qrCode: product.qrCode ?? '',
        brand: product.brand ?? '',
        description: product.description ?? '',
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
        supplier: product.supplier ?? '',
        arrivalDate: toDateInput(product.arrivalDate),
        expiryDate: toDateInput(product.expiryDate),
        shelfLocation: product.shelfLocation ?? '',
        categoryId: product.categoryId,
        isActive: product.isActive,
      });
      setImagePreview(product.imageUrl ?? null);
    } else {
      setForm(emptyForm(categories[0]?.id ?? '', initialBarcode));
      setImagePreview(null);
    }
    setPendingFile(null);
    setError('');
    setTimeout(() => {
      if (!product && !initialBarcode) barcodeRef.current?.focus();
    }, 50);
  }, [open, product, categories, initialBarcode]);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const special = allowsInternalBarcode({
    soldByWeight: form.soldByWeight,
    isSelfPacked: form.isSelfPacked,
    noFactoryBarcode: form.noFactoryBarcode,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!special && !(form.barcode ?? '').toString().trim() && !form.generateInternalBarcode) {
      setError(t('products.barcodeRequired'));
      barcodeRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await onSubmit({
        ...form,
        barcode: (form.barcode ?? '').toString().trim() || null,
        qrCode: (form.qrCode ?? '').toString().trim() || undefined,
        brand: form.brand || undefined,
        supplier: form.supplier || undefined,
        shelfLocation: form.shelfLocation || undefined,
        arrivalDate: form.arrivalDate || undefined,
        expiryDate: form.expiryDate || undefined,
        barcodeType: form.generateInternalBarcode || special ? (form.barcodeType ?? 'INTERNAL') : 'FACTORY',
      });
      if (pendingFile && onUploadImage) {
        await onUploadImage(saved.id, pendingFile);
      }
      onOpenChange(false);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? t('products.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrValue = product?.id
    ? buildProductQrUrl(product.id, window.location.origin)
    : form.barcode
      ? `${window.location.origin}/p/preview`
      : 'preview';
  const profit = form.price - form.costPrice;
  const locale = i18n.language;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>{isEdit ? t('products.editTitle') : t('products.addTitle')}</ModalTitle>
            <ModalDescription>
              {isEdit ? t('products.editDesc') : t('products.addDesc')}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-6 py-4">
            {/* Штрихкод — биринчи */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ScanBarcode className="h-4 w-4 text-primary" />
                {t('products.factoryBarcode')}
              </div>
              <div className="space-y-2">
                <Label>{t('products.barcode')}</Label>
                <Input
                  ref={barcodeRef}
                  data-barcode-scanner="true"
                  className="font-mono text-lg tracking-wide"
                  value={form.barcode ?? ''}
                  onChange={(e) => {
                    set('barcode', e.target.value);
                    set('generateInternalBarcode', false);
                    if (e.target.value.trim()) set('noFactoryBarcode', false);
                  }}
                  placeholder="4601234567890"
                  disabled={!!isEdit && form.barcodeType === 'FACTORY' && !!product?.barcode}
                />
                <p className="text-xs text-muted-foreground">{t('products.barcodeUniqueHint')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!form.noFactoryBarcode}
                    onChange={(e) => {
                      set('noFactoryBarcode', e.target.checked);
                      if (e.target.checked) set('barcodeType', 'INTERNAL');
                    }}
                  />
                  {t('products.noFactoryBarcode')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!form.soldByWeight}
                    onChange={(e) => {
                      set('soldByWeight', e.target.checked);
                      if (e.target.checked) set('unit', 'кг');
                    }}
                  />
                  {t('products.soldByWeight')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!form.isSelfPacked}
                    onChange={(e) => set('isSelfPacked', e.target.checked)}
                  />
                  {t('products.isSelfPacked')}
                </label>
              </div>

              {special && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      set('generateInternalBarcode', true);
                      set('barcodeType', 'INTERNAL');
                      set('barcode', '');
                    }}
                  >
                    {t('products.generateInternalBarcode')}
                  </Button>
                  {form.generateInternalBarcode && (
                    <span className="text-xs text-muted-foreground">{t('products.internalWillGenerate')}</span>
                  )}
                  {form.barcodeType === 'INTERNAL' && form.barcode && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {t('products.internalBarcode')}: {form.barcode}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.nameKy')}</Label>
                <Input touch value={form.nameKy} onChange={(e) => set('nameKy', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('products.nameRu')}</Label>
                <Input touch value={form.nameRu} onChange={(e) => set('nameRu', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.brand')}</Label>
                <Input value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value)} placeholder="Coca-Cola" />
              </div>
              <div className="space-y-2">
                <Label>{t('products.category')}</Label>
                <select
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm touch-manipulation"
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                  required
                >
                  <option value="">{t('products.selectCategory')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {locale === 'ru' ? c.nameRu : c.nameKy}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('products.qrCode')}</Label>
              <Input value={form.qrCode ?? ''} onChange={(e) => set('qrCode', e.target.value)} placeholder={t('products.qrAuto')} />
            </div>

            {qrValue && (
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <QRCodeSVG value={qrValue} size={80} />
                <p className="text-sm text-muted-foreground">{t('products.qrPreview')}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('products.costPrice')}</Label>
                <Input type="number" min={0} step="0.01" value={form.costPrice} onChange={(e) => set('costPrice', +e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('products.price')}</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set('price', +e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('products.stock')}</Label>
                <Input type="number" min={0} step="0.001" value={form.stock} onChange={(e) => set('stock', +e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('products.minStock')}</Label>
                <Input type="number" min={0} value={form.minStock} onChange={(e) => set('minStock', +e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.unit')}</Label>
                <Input value={form.unit} onChange={(e) => set('unit', e.target.value)} />
              </div>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground pb-3">
                  {t('products.profit')}:{' '}
                  <span className={profit >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                    {profit.toFixed(2)} сом
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('products.supplier')}</Label>
                <Input value={form.supplier ?? ''} onChange={(e) => set('supplier', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('products.arrivalDate')}</Label>
                <Input type="date" value={form.arrivalDate ?? ''} onChange={(e) => set('arrivalDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('products.expiryDate')}</Label>
                <Input type="date" value={form.expiryDate ?? ''} onChange={(e) => set('expiryDate', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('products.shelfLocation')}</Label>
              <Input value={form.shelfLocation ?? ''} onChange={(e) => set('shelfLocation', e.target.value)} placeholder="A-12-3" />
            </div>

            <div className="space-y-2">
              <Label>{t('products.image')}</Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" size="touch" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {t('products.uploadImage')}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            <label className="flex items-center gap-3 min-h-touch cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-5 w-5 accent-primary" />
              <span className="text-sm font-medium">{t('products.isActive')}</span>
            </label>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" size="touch" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
