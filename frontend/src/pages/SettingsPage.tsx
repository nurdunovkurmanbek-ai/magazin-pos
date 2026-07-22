import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store, MapPin, Phone, Receipt, Settings2, Loader2, Upload, Trash2, Save, DatabaseBackup,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoreSettings } from '@/providers/StoreSettingsProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, type StoreSettingsInput } from '@magazin/shared';
import { resolveMediaUrl } from '@/lib/media';
import { getLocalizedName } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { BackupTab } from '@/components/settings/BackupTab';

type Tab = 'store' | 'tax' | 'receipt' | 'general' | 'backup';

function settingsToForm(settings: NonNullable<ReturnType<typeof useStoreSettings>['settings']>): StoreSettingsInput {
  return {
    storeNameKy: settings.storeNameKy,
    storeNameRu: settings.storeNameRu,
    addressKy: settings.addressKy ?? '',
    addressRu: settings.addressRu ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
    taxId: settings.taxId ?? '',
    taxName: settings.taxName ?? '',
    taxRate: settings.taxRate,
    receiptHeaderKy: settings.receiptHeaderKy ?? '',
    receiptHeaderRu: settings.receiptHeaderRu ?? '',
    receiptFooterKy: settings.receiptFooterKy ?? '',
    receiptFooterRu: settings.receiptFooterRu ?? '',
    receiptShowLogo: settings.receiptShowLogo,
    receiptShowTax: settings.receiptShowTax,
    defaultLocale: settings.defaultLocale,
    currency: settings.currency,
    backupAutoEnabled: settings.backupAutoEnabled,
    backupIntervalHours: settings.backupIntervalHours,
    backupRetentionCount: settings.backupRetentionCount,
  };
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(Permission.SETTINGS_MANAGE);
  const { settings, isLoading, updateSettings, uploadLogo, removeLogo } = useStoreSettings();

  const [tab, setTab] = useState<Tab>('store');
  const [form, setForm] = useState<StoreSettingsInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoLoading, setLogoLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) setForm(settingsToForm(settings));
  }, [settings]);

  const tabs: { id: Tab; icon: typeof Store; label: string }[] = [
    { id: 'store', icon: Store, label: t('settings.tabStore') },
    { id: 'tax', icon: Receipt, label: t('settings.tabTax') },
    { id: 'receipt', icon: Receipt, label: t('settings.tabReceipt') },
    { id: 'general', icon: Settings2, label: t('settings.tabGeneral') },
    { id: 'backup', icon: DatabaseBackup, label: t('settings.tabBackup') },
  ];

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      await updateSettings(form);
    } catch (err) {
      setError((err as Error).message || t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true);
    try {
      await uploadLogo(file);
    } catch (err) {
      setError((err as Error).message || t('settings.logoError'));
    } finally {
      setLogoLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    setLogoLoading(true);
    try {
      await removeLogo();
    } finally {
      setLogoLoading(false);
    }
  };

  const set = <K extends keyof StoreSettingsInput>(key: K, value: StoreSettingsInput[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const logoUrl = resolveMediaUrl(settings?.logoUrl);
  const previewName = settings
    ? getLocalizedName(settings.storeNameKy, settings.storeNameRu, i18n.language)
    : '';

  return (
    <AppLayout title={t('settings.title')}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2 border-b pb-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <Button key={id} variant={tab === id ? 'default' : 'ghost'} size="touch" onClick={() => setTab(id)} className="gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        {isLoading || !form ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {tab === 'store' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.logo')}</CardTitle>
                    <CardDescription>{t('settings.logoDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="h-24 w-24 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Store className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    {canManage && (
                      <div className="flex flex-wrap gap-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <Button size="touch" variant="outline" disabled={logoLoading} onClick={() => fileRef.current?.click()}>
                          {logoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          {t('settings.uploadLogo')}
                        </Button>
                        {logoUrl && (
                          <Button size="touch" variant="outline" className="text-destructive" disabled={logoLoading} onClick={handleLogoRemove}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('settings.removeLogo')}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.storeInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('settings.storeNameKy')}</Label>
                        <Input value={form.storeNameKy} disabled={!canManage} onChange={(e) => set('storeNameKy', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('settings.storeNameRu')}</Label>
                        <Input value={form.storeNameRu} disabled={!canManage} onChange={(e) => set('storeNameRu', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('settings.addressKy')}</Label>
                        <Input value={form.addressKy ?? ''} disabled={!canManage} onChange={(e) => set('addressKy', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('settings.addressRu')}</Label>
                        <Input value={form.addressRu ?? ''} disabled={!canManage} onChange={(e) => set('addressRu', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label><Phone className="inline h-4 w-4 mr-1" />{t('settings.phone')}</Label>
                        <Input value={form.phone ?? ''} disabled={!canManage} onChange={(e) => set('phone', e.target.value)} placeholder="+996 555 123 456" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('settings.email')}</Label>
                        <Input type="email" value={form.email ?? ''} disabled={!canManage} onChange={(e) => set('email', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'tax' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.taxInfo')}</CardTitle>
                  <CardDescription>{t('settings.taxInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('settings.taxName')}</Label>
                    <Input value={form.taxName ?? ''} disabled={!canManage} onChange={(e) => set('taxName', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('settings.taxId')}</Label>
                      <Input value={form.taxId ?? ''} disabled={!canManage} onChange={(e) => set('taxId', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('settings.taxRate')}</Label>
                      <Input type="number" min="0" max="100" step="0.01" disabled={!canManage}
                        value={form.taxRate ?? ''} onChange={(e) => set('taxRate', e.target.value ? parseFloat(e.target.value) : null)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {tab === 'receipt' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.receiptTemplate')}</CardTitle>
                    <CardDescription>{t('settings.receiptTemplateDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('settings.receiptHeaderKy')}</Label>
                      <Input value={form.receiptHeaderKy ?? ''} disabled={!canManage} onChange={(e) => set('receiptHeaderKy', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('settings.receiptHeaderRu')}</Label>
                      <Input value={form.receiptHeaderRu ?? ''} disabled={!canManage} onChange={(e) => set('receiptHeaderRu', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('settings.receiptFooterKy')}</Label>
                      <Input value={form.receiptFooterKy ?? ''} disabled={!canManage} onChange={(e) => set('receiptFooterKy', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('settings.receiptFooterRu')}</Label>
                      <Input value={form.receiptFooterRu ?? ''} disabled={!canManage} onChange={(e) => set('receiptFooterRu', e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.receiptShowLogo} disabled={!canManage}
                        onChange={(e) => set('receiptShowLogo', e.target.checked)} className="h-4 w-4" />
                      <span className="text-sm">{t('settings.receiptShowLogo')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.receiptShowTax} disabled={!canManage}
                        onChange={(e) => set('receiptShowTax', e.target.checked)} className="h-4 w-4" />
                      <span className="text-sm">{t('settings.receiptShowTax')}</span>
                    </label>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.receiptPreview')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-xs bg-muted/50 rounded-lg p-4 space-y-1 max-w-xs mx-auto">
                      {form.receiptShowLogo && logoUrl && (
                        <div className="text-center mb-2">
                          <img src={logoUrl} alt="" className="h-10 mx-auto object-contain" />
                        </div>
                      )}
                      <div className="text-center font-bold">{previewName}</div>
                      {(form.addressKy || form.addressRu) && (
                        <div className="text-center text-muted-foreground">
                          <MapPin className="inline h-3 w-3" /> {getLocalizedName(form.addressKy ?? '', form.addressRu ?? '', i18n.language)}
                        </div>
                      )}
                      {form.phone && <div className="text-center">{form.phone}</div>}
                      {(form.receiptHeaderKy || form.receiptHeaderRu) && (
                        <div className="text-center text-muted-foreground border-t border-dashed pt-2 mt-2">
                          {getLocalizedName(form.receiptHeaderKy ?? '', form.receiptHeaderRu ?? '', i18n.language)}
                        </div>
                      )}
                      <div className="border-t border-dashed my-2" />
                      <div className="flex justify-between"><span>{t('pos.total')}</span><span>1 250 сом</span></div>
                      {form.receiptShowTax && form.taxId && (
                        <div className="text-center text-muted-foreground">{t('settings.taxId')}: {form.taxId}</div>
                      )}
                      <div className="text-center mt-2">
                        {getLocalizedName(form.receiptFooterKy ?? '', form.receiptFooterRu ?? '', i18n.language) || t('pos.thankYou')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.general')}</CardTitle>
                  <CardDescription>{t('settings.generalDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('settings.defaultLocale')}</Label>
                      <select className={cn('flex h-touch w-full rounded-md border border-input bg-background px-3 text-sm')}
                        value={form.defaultLocale} disabled={!canManage} onChange={(e) => set('defaultLocale', e.target.value as 'ky' | 'ru')}>
                        <option value="ky">{t('language.ky')}</option>
                        <option value="ru">{t('language.ru')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('settings.currency')}</Label>
                      <Input value={form.currency ?? 'KGS'} disabled={!canManage} onChange={(e) => set('currency', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {tab === 'backup' && form && (
              <BackupTab form={form} setForm={setForm} canManage={canManage} />
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {canManage && (
              <div className="flex justify-end">
                <Button size="touch" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {t('common.save')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
