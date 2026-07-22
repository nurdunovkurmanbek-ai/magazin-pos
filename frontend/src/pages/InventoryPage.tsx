import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, ClipboardList,
  History, Loader2, Plus, CheckCircle, XCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from '@/components/ui/modal';
import { useInventory } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, StockMovementType, InventoryCountStatus } from '@magazin/shared';
import type { PriceLabelBatch } from '@magazin/shared';
import { PriceLabelPrintModal } from '@/components/labels/PriceLabelPrintModal';
import { cn } from '@/lib/utils';

type Tab = 'alerts' | 'movements' | 'receipt' | 'writeoff' | 'counts';

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  [StockMovementType.RECEIPT]: 'inventory.typeReceipt',
  [StockMovementType.WRITE_OFF]: 'inventory.typeWriteOff',
  [StockMovementType.ADJUSTMENT]: 'inventory.typeAdjustment',
  [StockMovementType.SALE]: 'inventory.typeSale',
  [StockMovementType.REFUND]: 'inventory.typeRefund',
  [StockMovementType.COUNT]: 'inventory.typeCount',
};

const ALERT_VARIANT: Record<string, 'destructive' | 'warning' | 'secondary'> = {
  OUT_OF_STOCK: 'destructive',
  LOW_STOCK: 'warning',
  EXPIRED: 'destructive',
  EXPIRY_SOON: 'warning',
};

export function InventoryPage() {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(Permission.INVENTORY_MANAGE);
  const locale = i18n.language;

  const {
    alerts, movements, counts, activeCount, isLoading,
    fetchMovements, fetchCounts, fetchCount,
    receipt, writeOff, createCount, updateCountItems, completeCount, cancelCount,
  } = useInventory();

  const { products } = useProducts({ limit: 500 });

  const [tab, setTab] = useState<Tab>('alerts');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Receipt form
  const [receiptForm, setReceiptForm] = useState({
    productId: '', quantity: '', unitCost: '', supplier: '', reason: '', printLabels: true,
  });

  const [labelBatch, setLabelBatch] = useState<PriceLabelBatch | null>(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  // Write-off form
  const [writeOffForm, setWriteOffForm] = useState({
    productId: '', quantity: '', reason: '',
  });

  // Count editing
  const [countEdits, setCountEdits] = useState<Record<string, string>>({});
  const [countModalOpen, setCountModalOpen] = useState(false);

  const tabs: { key: Tab; icon: typeof AlertTriangle; label: string }[] = [
    { key: 'alerts', icon: AlertTriangle, label: t('inventory.tabs.alerts') },
    { key: 'movements', icon: History, label: t('inventory.tabs.movements') },
    { key: 'receipt', icon: ArrowDownCircle, label: t('inventory.tabs.receipt') },
    { key: 'writeoff', icon: ArrowUpCircle, label: t('inventory.tabs.writeOff') },
    { key: 'counts', icon: ClipboardList, label: t('inventory.tabs.counts') },
  ];

  const handleTabChange = (key: Tab) => {
    setTab(key);
    setFormError('');
    if (key === 'movements') fetchMovements();
    if (key === 'counts') fetchCounts();
  };

  const handleReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const result = await receipt({
        productId: receiptForm.productId,
        quantity: parseFloat(receiptForm.quantity),
        unitCost: receiptForm.unitCost ? parseFloat(receiptForm.unitCost) : undefined,
        supplier: receiptForm.supplier || undefined,
        reason: receiptForm.reason || undefined,
        printLabels: receiptForm.printLabels,
      });
      setReceiptForm({ productId: '', quantity: '', unitCost: '', supplier: '', reason: '', printLabels: true });
      if (result.labelBatch.count > 0) {
        setLabelBatch(result.labelBatch);
        setLabelModalOpen(true);
      } else {
        setTab('movements');
      }
    } catch (err: unknown) {
      setFormError((err as Error).message || t('inventory.saveError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await writeOff({
        productId: writeOffForm.productId,
        quantity: parseFloat(writeOffForm.quantity),
        reason: writeOffForm.reason,
      });
      setWriteOffForm({ productId: '', quantity: '', reason: '' });
      setTab('movements');
    } catch (err: unknown) {
      setFormError((err as Error).message || t('inventory.saveError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartCount = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const count = await createCount();
      setCountEdits(
        Object.fromEntries(
          (count.items ?? []).map((i) => [i.productId, String(i.countedQty)])
        )
      );
      setCountModalOpen(true);
    } catch (err: unknown) {
      setFormError((err as Error).message || t('inventory.saveError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenCount = async (id: string) => {
    const count = await fetchCount(id);
    if (count.status === InventoryCountStatus.IN_PROGRESS) {
      setCountEdits(
        Object.fromEntries(
          (count.items ?? []).map((i) => [i.productId, String(i.countedQty)])
        )
      );
    }
    setCountModalOpen(true);
  };

  const handleSaveCount = async () => {
    if (!activeCount) return;
    setFormLoading(true);
    setFormError('');
    try {
      const items = Object.entries(countEdits).map(([productId, countedQty]) => ({
        productId,
        countedQty: parseFloat(countedQty) || 0,
      }));
      await updateCountItems(activeCount.id, items);
    } catch (err: unknown) {
      const msg = (err as Error).message || t('inventory.saveError');
      setFormError(msg);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleCompleteCount = async () => {
    if (!activeCount) return;
    setFormLoading(true);
    setFormError('');
    try {
      await handleSaveCount();
      await completeCount(activeCount.id);
      setCountModalOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || t('inventory.saveError'));
    } finally {
      setFormLoading(false);
    }
  };

  const productName = (nameKy: string, nameRu: string) =>
    locale === 'ru' ? nameRu : nameKy;

  return (
    <AppLayout title={t('inventory.title')}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">{t('inventory.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={tab === key ? 'default' : 'outline'}
              size="touch"
              onClick={() => handleTabChange(key)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === 'alerts' && alerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1">
                  {alerts.length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Alerts tab */}
        {tab === 'alerts' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                {t('inventory.alertsTitle')}
              </CardTitle>
              <CardDescription>{t('inventory.alertsDesc', { count: alerts.length })}</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('inventory.noAlerts')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.product')}</TableHead>
                      <TableHead>{t('inventory.stock')}</TableHead>
                      <TableHead>{t('inventory.minStock')}</TableHead>
                      <TableHead>{t('inventory.shelf')}</TableHead>
                      <TableHead>{t('inventory.alertType')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          {productName(a.nameKy, a.nameRu)}
                        </TableCell>
                        <TableCell>
                          <span className={cn(a.stock <= 0 && 'text-destructive font-semibold')}>
                            {a.stock} {a.unit}
                          </span>
                        </TableCell>
                        <TableCell>{a.minStock} {a.unit}</TableCell>
                        <TableCell>{a.shelfLocation ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={ALERT_VARIANT[a.alertType] ?? 'secondary'}>
                            {t(`inventory.alert_${a.alertType}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Movements tab */}
        {tab === 'movements' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.movementsTitle')}</CardTitle>
              <CardDescription>{t('inventory.movementsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !movements?.items.length ? (
                <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('inventory.date')}</TableHead>
                        <TableHead>{t('inventory.product')}</TableHead>
                        <TableHead>{t('inventory.type')}</TableHead>
                        <TableHead>{t('inventory.quantity')}</TableHead>
                        <TableHead>{t('inventory.stockAfter')}</TableHead>
                        <TableHead>{t('inventory.reason')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.items.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm">
                            {new Date(m.createdAt).toLocaleString(locale)}
                          </TableCell>
                          <TableCell>
                            {m.product
                              ? productName(m.product.nameKy, m.product.nameRu)
                              : m.productId}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{t(MOVEMENT_LABELS[m.type])}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              'font-semibold',
                              m.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {m.quantity > 0 ? '+' : ''}{m.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{m.stockAfter}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.reason ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {movements.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline" size="sm"
                        disabled={movements.page <= 1}
                        onClick={() => fetchMovements(movements.page - 1)}
                      >←</Button>
                      <span className="self-center text-sm">
                        {movements.page} / {movements.totalPages}
                      </span>
                      <Button
                        variant="outline" size="sm"
                        disabled={movements.page >= movements.totalPages}
                        onClick={() => fetchMovements(movements.page + 1)}
                      >→</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Receipt tab */}
        {tab === 'receipt' && canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-green-600" />
                {t('inventory.receiptTitle')}
              </CardTitle>
              <CardDescription>{t('inventory.receiptDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReceipt} className="grid gap-4 max-w-lg">
                <div className="space-y-2">
                  <Label>{t('inventory.product')}</Label>
                  <select
                    className="flex h-touch w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={receiptForm.productId}
                    onChange={(e) => setReceiptForm({ ...receiptForm, productId: e.target.value })}
                    required
                  >
                    <option value="">{t('inventory.selectProduct')}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {productName(p.nameKy, p.nameRu)} ({p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('inventory.quantity')}</Label>
                    <Input
                      type="number" min="0.001" step="any" required
                      value={receiptForm.quantity}
                      onChange={(e) => setReceiptForm({ ...receiptForm, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('inventory.unitCost')}</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={receiptForm.unitCost}
                      onChange={(e) => setReceiptForm({ ...receiptForm, unitCost: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.supplier')}</Label>
                  <Input
                    value={receiptForm.supplier}
                    onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.reason')}</Label>
                  <Input
                    value={receiptForm.reason}
                    onChange={(e) => setReceiptForm({ ...receiptForm, reason: e.target.value })}
                    placeholder={t('inventory.receiptReasonPlaceholder')}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptForm.printLabels}
                    onChange={(e) => setReceiptForm({ ...receiptForm, printLabels: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{t('labels.autoPrint')}</span>
                </label>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" size="touch" disabled={formLoading}>
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('inventory.receiptSubmit')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Write-off tab */}
        {tab === 'writeoff' && canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-red-600" />
                {t('inventory.writeOffTitle')}
              </CardTitle>
              <CardDescription>{t('inventory.writeOffDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWriteOff} className="grid gap-4 max-w-lg">
                <div className="space-y-2">
                  <Label>{t('inventory.product')}</Label>
                  <select
                    className="flex h-touch w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={writeOffForm.productId}
                    onChange={(e) => setWriteOffForm({ ...writeOffForm, productId: e.target.value })}
                    required
                  >
                    <option value="">{t('inventory.selectProduct')}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {productName(p.nameKy, p.nameRu)} ({p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.quantity')}</Label>
                  <Input
                    type="number" min="0.001" step="any" required
                    value={writeOffForm.quantity}
                    onChange={(e) => setWriteOffForm({ ...writeOffForm, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.reason')} *</Label>
                  <Input
                    required
                    value={writeOffForm.reason}
                    onChange={(e) => setWriteOffForm({ ...writeOffForm, reason: e.target.value })}
                    placeholder={t('inventory.writeOffReasonPlaceholder')}
                  />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" size="touch" variant="destructive" disabled={formLoading}>
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('inventory.writeOffSubmit')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Counts tab */}
        {tab === 'counts' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('inventory.countsTitle')}</CardTitle>
                <CardDescription>{t('inventory.countsDesc')}</CardDescription>
              </div>
              {canManage && (
                <Button size="touch" onClick={handleStartCount} disabled={formLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inventory.startCount')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {formError && <p className="text-sm text-destructive mb-4">{formError}</p>}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !counts?.items.length ? (
                <p className="text-center text-muted-foreground py-8">{t('inventory.noCounts')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.countNumber')}</TableHead>
                      <TableHead>{t('inventory.status')}</TableHead>
                      <TableHead>{t('inventory.items')}</TableHead>
                      <TableHead>{t('inventory.variances')}</TableHead>
                      <TableHead>{t('inventory.date')}</TableHead>
                      <TableHead>{t('inventory.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {counts.items.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.countNumber}</TableCell>
                        <TableCell>
                          <Badge variant={
                            c.status === InventoryCountStatus.COMPLETED ? 'default' :
                            c.status === InventoryCountStatus.CANCELLED ? 'secondary' : 'outline'
                          }>
                            {t(`inventory.status_${c.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{c.itemCount ?? 0}</TableCell>
                        <TableCell>
                          {(c.varianceCount ?? 0) > 0 ? (
                            <Badge variant="warning">{c.varianceCount}</Badge>
                          ) : '0'}
                        </TableCell>
                        <TableCell>{new Date(c.createdAt).toLocaleDateString(locale)}</TableCell>
                        <TableCell>
                          {c.status === InventoryCountStatus.IN_PROGRESS && canManage && (
                            <Button size="sm" variant="outline" onClick={() => handleOpenCount(c.id)}>
                              {t('inventory.continueCount')}
                            </Button>
                          )}
                          {c.status === InventoryCountStatus.COMPLETED && (
                            <Button size="sm" variant="ghost" onClick={() => handleOpenCount(c.id)}>
                              {t('inventory.viewCount')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {!canManage && (tab === 'receipt' || tab === 'writeoff') && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('auth.accessDenied')}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Count modal */}
      <Modal open={countModalOpen} onOpenChange={setCountModalOpen}>
        <ModalContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>
              {t('inventory.countSession')} — {activeCount?.countNumber}
            </ModalTitle>
            <ModalDescription>{t('inventory.countSessionDesc')}</ModalDescription>
          </ModalHeader>

          {activeCount?.items && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inventory.product')}</TableHead>
                  <TableHead>{t('inventory.expected')}</TableHead>
                  <TableHead>{t('inventory.counted')}</TableHead>
                  <TableHead>{t('inventory.variance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCount.items.map((item) => {
                  const counted = parseFloat(countEdits[item.productId] ?? '0') || 0;
                  const variance = counted - item.expectedQty;
                  const isReadonly = activeCount.status === InventoryCountStatus.COMPLETED;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.product
                          ? productName(item.product.nameKy, item.product.nameRu)
                          : item.productId}
                      </TableCell>
                      <TableCell>{item.expectedQty} {item.product?.unit}</TableCell>
                      <TableCell>
                        {isReadonly ? (
                          item.countedQty
                        ) : (
                          <Input
                            type="number" min="0" step="any"
                            className="w-24"
                            value={countEdits[item.productId] ?? ''}
                            onChange={(e) =>
                              setCountEdits({ ...countEdits, [item.productId]: e.target.value })
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          variance !== 0 && 'font-semibold',
                          variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''
                        )}>
                          {isReadonly ? item.variance : (variance > 0 ? '+' : '') + variance}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {formError && <p className="text-sm text-destructive mt-2">{formError}</p>}

          <ModalFooter>
            {activeCount?.status === InventoryCountStatus.IN_PROGRESS && canManage && (
              <>
                <Button
                  variant="outline" size="touch"
                  onClick={() => activeCount && cancelCount(activeCount.id)}
                  disabled={formLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button variant="outline" size="touch" onClick={handleSaveCount} disabled={formLoading}>
                  {t('common.save')}
                </Button>
                <Button size="touch" onClick={handleCompleteCount} disabled={formLoading}>
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('inventory.completeCount')}
                    </>
                  )}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <PriceLabelPrintModal
        open={labelModalOpen}
        onOpenChange={(open) => {
          setLabelModalOpen(open);
          if (!open) setTab('movements');
        }}
        batch={labelBatch}
        autoPrint
      />
    </AppLayout>
  );
}
